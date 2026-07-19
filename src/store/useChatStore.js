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

// Centralized typing state: auto-clear a "typing" flag if the matching "stopped"
// event never arrives. Keyed by `${conversationId}:${userId}`.
const TYPING_TIMEOUT_MS = 5000;
const typingTimers = {};

export const useChatStore = create((set, get) => ({
    messages: [],
    // Single source of truth for typing: { [conversationId]: string[] of userIds }.
    typingByConversation: {},
    isLoadingMessages: false,
    isFetchingMore: false,
    hasMore: true,
    firstItemIndex: START_INDEX,

    clearMessages: () => set({ messages: [], hasMore: true, firstItemIndex: START_INDEX }),

    fetchHistory: async (conversationId) => {
        if (!conversationId) return;

        set({ isLoadingMessages: true, messages: [], hasMore: true });

        try {
            const res = await messageApi.getMessages(conversationId, { limit: MESSAGES_PER_PAGE });
            const fetchedMessages = res.data?.data || res.data || [];
            // Prefer the server's cursor signal; fall back to length heuristic.
            const hasMore = res.data?.pagination?.hasMore ?? (fetchedMessages.length >= MESSAGES_PER_PAGE);

            set({
                messages: fetchedMessages,
                hasMore,
                firstItemIndex: START_INDEX
            });

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
            set({ isLoadingMessages: false });
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

        socket.emit("send_message", tempMessage, (response) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.clientMessageId === tempMessage.clientMessageId
                        ? { ...msg, sending: false, failed: !response.success, _id: response.messageId || msg._id }
                        : msg
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
        const activeConversation = useConversationStore.getState().activeConversation;
        const currentUserId = String(useAuthStore.getState().user?.id || '');
        const socket = useSocketStore.getState().socket;

        if (String(message.conversationId) !== String(activeConversation)) return;

        set((state) => {
            const exists = state.messages.some((m) => m.clientMessageId === message.clientMessageId || m._id === message._id);
            if (exists) return state;
            return { messages: [...state.messages, message] };
        });

        if (String(message.senderId) !== currentUserId && socket) {
            socket.emit("mark_read", {
                conversationId: message.conversationId,
                messageId: message._id || message.clientMessageId
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
        const activeConversation = useConversationStore.getState().activeConversation;
        if (String(conversationId) !== String(activeConversation)) return;

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
    }
}));