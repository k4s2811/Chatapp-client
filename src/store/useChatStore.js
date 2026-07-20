import { create } from 'zustand';
import { messageApi } from '../api/messageApi';
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';
import { useConversationStore } from './useConversationStore';

const MESSAGES_PER_PAGE = 20;

// Virtuoso's firstItemIndex must stay positive as we prepend older messages
// (it decreases by the prepended count). Start from a large base so it can't
// hit zero / go negative — which would break scroll anchoring on pagination.
const START_INDEX = 1_000_000;

// How many conversations' message threads to keep in memory. Re-opening any of
// these is instant (no refetch, no loader). Oldest is evicted past the cap.
const MAX_CACHED = 12;

// Ack timeout for socket sends. If the server never acks within this window
// (dropped connection, etc.), the optimistic bubble is marked `failed` so the
// user gets a retry affordance instead of a spinner that never resolves.
const SEND_TIMEOUT_MS = 15000;

// Centralized typing state: auto-clear a "typing" flag if the matching "stopped"
// event never arrives. Keyed by `${conversationId}:${userId}`.
const TYPING_TIMEOUT_MS = 5000;
const typingTimers = {};

// Snapshot the currently-open thread into the per-conversation cache and return
// the new { cache, cacheOrder } (LRU — most-recently-used at the end).
function stashActive(state) {
    const convId = state.activeConvId ? String(state.activeConvId) : null;
    if (!convId) return { cache: state.cache, cacheOrder: state.cacheOrder };

    const cache = {
        ...state.cache,
        [convId]: {
            messages: state.messages,
            hasMore: state.hasMore,
            firstItemIndex: state.firstItemIndex,
        },
    };
    const cacheOrder = [...state.cacheOrder.filter((id) => id !== convId), convId];
    while (cacheOrder.length > MAX_CACHED) {
        const evicted = cacheOrder.shift();
        if (evicted !== convId) delete cache[evicted];
    }
    return { cache, cacheOrder };
}

export const useChatStore = create((set, get) => ({
    messages: [],
    // Which conversation the `messages` array currently represents. Tracked
    // separately from useConversationStore.activeConversation so we can detect a
    // pending switch and stash/restore threads without races.
    activeConvId: null,
    // Per-conversation cache: { [conversationId]: { messages, hasMore, firstItemIndex } }.
    cache: {},
    cacheOrder: [],
    // Single source of truth for typing: { [conversationId]: string[] of userIds }.
    typingByConversation: {},
    isLoadingMessages: false,
    isFetchingMore: false,
    hasMore: true,
    firstItemIndex: START_INDEX,

    // Full reset (used on teardown/sign-out). Drops the cache too so a different
    // user can't briefly see a previous session's threads.
    clearMessages: () => set({
        messages: [], hasMore: true, firstItemIndex: START_INDEX,
        activeConvId: null, cache: {}, cacheOrder: [],
    }),

    // Open a conversation: stash the outgoing thread, then either restore the
    // incoming one from cache instantly or fetch it. Idempotent — re-opening the
    // already-open conversation is a no-op.
    fetchHistory: async (conversationId) => {
        if (!conversationId) return;
        const cid = String(conversationId);
        const state = get();
        if (String(state.activeConvId) === cid) return; // already open

        const stashed = stashActive(state);
        const cached = stashed.cache[cid];

        // Cache hit → instant restore, no network, no loader. Live socket events
        // keep cached-but-not-open threads fresh (see handleSocketNewMessage), so
        // what we restore is already up to date.
        if (cached) {
            set({
                ...stashed,
                activeConvId: cid,
                messages: cached.messages,
                hasMore: cached.hasMore,
                firstItemIndex: cached.firstItemIndex,
                isLoadingMessages: false,
            });
            return;
        }

        set({
            ...stashed,
            activeConvId: cid,
            messages: [],
            hasMore: true,
            firstItemIndex: START_INDEX,
            isLoadingMessages: true,
        });

        try {
            const res = await messageApi.getMessages(conversationId, { limit: MESSAGES_PER_PAGE });
            const fetchedMessages = res.data?.data || res.data || [];
            // Prefer the server's cursor signal; fall back to length heuristic.
            const hasMore = res.data?.pagination?.hasMore ?? (fetchedMessages.length >= MESSAGES_PER_PAGE);
            const entry = { messages: fetchedMessages, hasMore, firstItemIndex: START_INDEX };

            // The user may have switched away while this was in flight — keep the
            // result in cache for later, but don't disturb the current view.
            if (String(get().activeConvId) !== cid) {
                set((s) => ({ cache: { ...s.cache, [cid]: entry } }));
                return;
            }

            set((s) => ({
                messages: fetchedMessages,
                hasMore,
                firstItemIndex: START_INDEX,
                cache: { ...s.cache, [cid]: entry },
            }));

            const currentUserId = String(useAuthStore.getState().user?.id || '');
            const socket = useSocketStore.getState().socket;
            const otherMessage = [...fetchedMessages].reverse().find(m => String(m.senderId) !== currentUserId);
            if (otherMessage && socket) {
                socket.emit("mark_read", {
                    conversationId,
                    messageId: otherMessage._id || otherMessage.clientMessageId
                });
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            if (String(get().activeConvId) === cid) set({ isLoadingMessages: false });
        }
    },

    // Re-pull the newest page for the open thread (used after a reconnect, where
    // the socket does NOT replay messages missed while disconnected).
    refreshActiveHistory: async () => {
        const convId = get().activeConvId;
        if (!convId) return;
        const cid = String(convId);
        try {
            const res = await messageApi.getMessages(cid, { limit: MESSAGES_PER_PAGE });
            const fetched = res.data?.data || res.data || [];
            const hasMore = res.data?.pagination?.hasMore ?? (fetched.length >= MESSAGES_PER_PAGE);
            if (String(get().activeConvId) !== cid) return;
            set((s) => ({
                messages: fetched,
                hasMore,
                firstItemIndex: START_INDEX,
                cache: { ...s.cache, [cid]: { messages: fetched, hasMore, firstItemIndex: START_INDEX } },
            }));
        } catch (error) {
            console.error("Failed to refresh messages:", error);
        }
    },

    loadMoreMessages: async () => {
        const { hasMore, isFetchingMore, messages } = get();
        const activeConversation = useConversationStore.getState().activeConversation;

        if (!hasMore || isFetchingMore || !messages.length || !activeConversation) return;

        set({ isFetchingMore: true });
        try {
            const oldestMessageId = messages[0]._id || messages[0].clientMessageId;

            const res = await messageApi.getMessages(activeConversation, {
                limit: MESSAGES_PER_PAGE,
                before: oldestMessageId
            });

            const olderMessages = res.data?.data || res.data || [];
            const hasMore = res.data?.pagination?.hasMore ?? (olderMessages.length >= MESSAGES_PER_PAGE);

            set((state) => ({
                messages: [...olderMessages, ...state.messages],
                hasMore,
                firstItemIndex: state.firstItemIndex - olderMessages.length
            }));
        } catch (error) {
            console.error("Failed to fetch older messages:", error);
        } finally {
            set({ isFetchingMore: false });
        }
    },

    sendMessage: ({ conversationId, text, attachments = [] }) => {
        const socket = useSocketStore.getState().socket;
        const currentUserId = String(useAuthStore.getState().user?.id || '');
        if (!socket) return;

        const generateId = () => {
            return window.crypto && window.crypto.randomUUID
                ? window.crypto.randomUUID()
                : Date.now().toString(36) + Math.random().toString(36).substring(2);
        };

        const tempMessage = {
            conversationId,
            text,
            attachments,
            senderId: currentUserId,
            clientMessageId: generateId(),
            createdAt: new Date().toISOString(),
            sending: true
        };

        // Optimistic update
        set((state) => ({ messages: [...state.messages, tempMessage] }));

        // .timeout() so a dropped / never-acked send resolves as `failed` (→ retry
        // UI) instead of sticking on the "sending" clock forever.
        socket.timeout(SEND_TIMEOUT_MS).emit("send_message", tempMessage, (err, response) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.clientMessageId === tempMessage.clientMessageId
                        ? { ...msg, sending: false, failed: !!err || !response?.success, _id: response?.messageId || msg._id }
                        : msg
                )
            }));
        });
    },

    // Re-send a message whose optimistic bubble is in the `failed` state, reusing
    // its clientMessageId so the server dedups if the original actually landed.
    retryMessage: (clientMessageId) => {
        const socket = useSocketStore.getState().socket;
        const msg = get().messages.find((m) => m.clientMessageId === clientMessageId);
        if (!msg || !socket) return;

        set((state) => ({
            messages: state.messages.map((m) =>
                m.clientMessageId === clientMessageId ? { ...m, sending: true, failed: false } : m
            )
        }));

        socket.timeout(SEND_TIMEOUT_MS).emit("send_message", {
            conversationId: msg.conversationId,
            text: msg.text,
            attachments: msg.attachments || [],
            clientMessageId,
        }, (err, response) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m.clientMessageId === clientMessageId
                        ? { ...m, sending: false, failed: !!err || !response?.success, _id: response?.messageId || m._id }
                        : m
                )
            }));
        });
    },

    deleteMessage: async (messageId) => {
        if (!messageId) return;

        set((state) => ({
            messages: state.messages.map((msg) => {
                if (msg._id === messageId || msg.clientMessageId === messageId) {
                    return {
                        ...msg,
                        isDeleted: true,
                        content: { ...msg.content, text: "This message was deleted", attachments: [] },
                        text: "This message was deleted"
                    };
                }
                return msg;
            })
        }));

        try { await messageApi.deleteMessage(messageId); }
        catch (error) { console.error("Failed to delete message:", error); }
    },

    sendTyping: (conversationId, isTyping) => {
        const socket = useSocketStore.getState().socket;
        if (socket && conversationId) socket.emit("typing", { conversationId, isTyping });
    },

    // Handlers for Socket Events
    handleSocketNewMessage: (message) => {
        const activeConvId = String(get().activeConvId || '');
        const currentUserId = String(useAuthStore.getState().user?.id || '');
        const socket = useSocketStore.getState().socket;
        const cid = String(message.conversationId);

        const append = (list) => {
            const exists = list.some((m) =>
                (message.clientMessageId && m.clientMessageId === message.clientMessageId) ||
                (message._id && m._id === message._id));
            return exists ? list : [...list, message];
        };

        if (cid === activeConvId) {
            set((state) => ({ messages: append(state.messages) }));
            if (String(message.senderId) !== currentUserId && socket) {
                socket.emit("mark_read", {
                    conversationId: message.conversationId,
                    messageId: message._id || message.clientMessageId
                });
            }
        } else {
            // Keep a cached-but-not-open thread fresh so re-opening it is both
            // instant AND current.
            set((state) => {
                const entry = state.cache[cid];
                if (!entry) return state;
                return { cache: { ...state.cache, [cid]: { ...entry, messages: append(entry.messages) } } };
            });
        }
    },

    // Single typing handler for the whole app — records who is typing in which
    // conversation. ChatWindow and Sidebar both derive from typingByConversation.
    handleSocketTyping: ({ userId, conversationId, isTyping }) => {
        const cid = String(conversationId);
        const uid = String(userId);
        const key = `${cid}:${uid}`;

        const setTyping = (typing) => set((state) => {
            const current = state.typingByConversation[cid] || [];
            const has = current.includes(uid);
            if (typing === has) return state; // no change
            const next = typing ? [...current, uid] : current.filter((id) => id !== uid);
            return { typingByConversation: { ...state.typingByConversation, [cid]: next } };
        });

        if (typingTimers[key]) { clearTimeout(typingTimers[key]); delete typingTimers[key]; }

        setTyping(!!isTyping);

        if (isTyping) {
            typingTimers[key] = setTimeout(() => {
                delete typingTimers[key];
                setTyping(false);
            }, TYPING_TIMEOUT_MS);
        }
    },

    handleSocketMessageDeleted: ({ messageId, conversationId }) => {
        const cid = String(conversationId);
        const activeConvId = String(get().activeConvId || '');

        const applyDelete = (list) => list.map((msg) => {
            if (msg._id === messageId || msg.clientMessageId === messageId) {
                return {
                    ...msg,
                    isDeleted: true,
                    content: { ...msg.content, text: "This message was deleted", attachments: [] },
                    text: "This message was deleted"
                };
            }
            return msg;
        });

        if (cid === activeConvId) {
            set((state) => ({ messages: applyDelete(state.messages) }));
        } else {
            set((state) => {
                const entry = state.cache[cid];
                if (!entry) return state;
                return { cache: { ...state.cache, [cid]: { ...entry, messages: applyDelete(entry.messages) } } };
            });
        }
    }
}));
