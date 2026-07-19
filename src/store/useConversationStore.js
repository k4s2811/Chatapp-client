import { create } from 'zustand';
import { conversationApi } from '../api/conversationApi';
import { usersApi } from '../api/auth';
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';
import { useChatStore } from './useChatStore';

export const useConversationStore = create((set, get) => ({
    conversations: [],
    activeConversation: null,
    selectedUser: null,
    isLoading: true,

    setActiveConversation: (id) => set({ activeConversation: id }),
    setSelectedUser: (user) => set({ selectedUser: user }),
    clearConversation: () => set({ activeConversation: null, selectedUser: null }),

    loadConversations: async () => {
        const currentUserId = String(useAuthStore.getState().user?.id || '');
        if (!currentUserId) return;
        
        set({ isLoading: true });

        try {
            const convRes = await conversationApi.getConversations();
            let fetchedConvs = convRes.data?.data || convRes.data || [];

            fetchedConvs = fetchedConvs.map(conv => {
                const myParticipantRecord = conv.participants?.find(
                    p => String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id) === currentUserId
                );

                const lastReadId = myParticipantRecord?.lastReadMessageId;
                const lastMsgId = conv.lastMessage?.messageId;
                const senderId = conv.lastMessage?.senderId;

                let hasUnread = false;
                if (lastMsgId && String(senderId) !== currentUserId && String(lastReadId) !== String(lastMsgId)) {
                    hasUnread = true;
                }

                // Hydrate each participant's identity from the denormalized
                // snapshot the chat service now stores (name/avatarUrl) — no
                // cross-service /usersByIds fetch needed. Shape the id into the
                // { id, name, avatar_url } object the UI already expects.
                const participants = (conv.participants || []).map(p => {
                    if (p.userId && typeof p.userId === 'object') return p; // already hydrated (optimistic path)
                    return {
                        ...p,
                        userId: {
                            id: String(p.userId),
                            name: p.name || null,
                            avatar_url: p.avatarUrl || null,
                        },
                    };
                });

                return { ...conv, participants, hasUnread };
            });

            set({ conversations: fetchedConvs });
        } catch (err) {
            console.error("Failed to fetch sidebar data:", err);
        } finally {
            set({ isLoading: false });
        }
    },

    startOrSelectConversation: async (targetUser) => {
        const currentUser = useAuthStore.getState().user;
        const socket = useSocketStore.getState().socket;

        // --- UPDATED: Keep all the required fields ---
        const formattedUser = {
            id: targetUser._id || targetUser.id,
            name: targetUser.name || targetUser.email?.split('@')[0] || 'User',
            avatar: targetUser.avatar_url || targetUser.avatar || null,
            email: targetUser.email || null,
            bio: targetUser.bio || null,
            created_at: targetUser.created_at || targetUser.createdAt || null,
        };

        // If this DM is already the open conversation, just refresh the header —
        // don't clear/reload.
        const existing = get().conversations.find(c =>
            !c.isGroup && (c.participants || []).some(p =>
                String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id) === String(formattedUser.id))
        );
        const existingId = existing ? String(existing._id || existing.id) : null;
        if (existingId && String(get().activeConversation) === existingId) {
            set({ selectedUser: formattedUser });
            return;
        }

        // Switching: reset the message pane and show loading up front, so the new
        // user's header never renders over the previous conversation's messages
        // (selectedUser and activeConversation can't visibly disagree).
        useChatStore.setState({ messages: [], isLoadingMessages: true, hasMore: true });
        set({ selectedUser: formattedUser });

        // The sidebar/denormalized path only carries name + avatar, so fetch the
        // full profile (email, bio, joined date) for the chat header — one call
        // per chat open, best effort. Guarded so a stale response can't overwrite
        // a newer selection.
        usersApi.getUsersByIds([formattedUser.id]).then((res) => {
            const full = (res.data?.data || res.data || [])[0];
            if (!full) return;
            set((state) => {
                if (String(state.selectedUser?.id) !== String(formattedUser.id)) return state;
                return {
                    selectedUser: {
                        ...state.selectedUser,
                        email: full.email ?? state.selectedUser.email,
                        bio: full.bio ?? state.selectedUser.bio,
                        avatar: full.avatar_url || state.selectedUser.avatar,
                        created_at: full.created_at ?? state.selectedUser.created_at,
                    },
                };
            });
        }).catch(() => {});

        try {
            const res = await conversationApi.createOrGetConversation(formattedUser.id);
            const conversationData = res.data?.data || res.data;
            const convId = conversationData._id || conversationData.id;

            set({ activeConversation: convId });

            if (socket) {
                socket.emit("join_conversation", convId);
            }

            if (conversationData.lastMessage?.messageId) {
                conversationApi.markConversationRead(convId, conversationData.lastMessage.messageId).catch(console.error);
                if (socket) {
                    socket.emit("mark_read", { conversationId: convId, messageId: conversationData.lastMessage.messageId });
                }
            }

            // Optimistically update conversation list
            const currentConvs = get().conversations;
            const exists = currentConvs.find(c => String(c._id || c.id) === String(convId));

            if (exists) {
                set({ conversations: currentConvs.map(c => 
                    String(c._id || c.id) === String(convId) ? { ...c, hasUnread: false } : c
                )});
            } else {
                set({ conversations: [{
                    ...conversationData,
                    hasUnread: false,
                    participants: [{ userId: formattedUser }, { userId: currentUser }]
                }, ...currentConvs] });
            }
        } catch (err) {
            console.error("Error routing conversation:", err);
            // Don't leave the message pane stuck on the loading spinner.
            useChatStore.setState({ isLoadingMessages: false });
        }
    },

    // Handlers for Socket Events (Called by the Socket Manager)
    handleSocketNewMessage: (message) => {
        const currentUserId = String(useAuthStore.getState().user?.id || '');
        set((state) => {
            const updated = [...state.conversations];
            const index = updated.findIndex(c =>
                String(c._id || c.id) === String(message.conversationId)
            );

            if (index > -1) {
                const conv = { ...updated[index] };
                conv.lastMessage = {
                    messageId: message._id || message.clientMessageId,
                    content: message.text || message.content?.text || "[Attachment]",
                    senderId: message.senderId,
                    createdAt: message.createdAt || new Date().toISOString()
                };

                if (String(state.activeConversation) !== String(message.conversationId) && String(message.senderId) !== currentUserId) {
                    conv.hasUnread = true; 
                }

                updated.splice(index, 1);
                updated.unshift(conv);
                return { conversations: updated };
            } else {
                get().loadConversations(); // Fetch fresh if it's a brand new chat
                return state;
            }
        });
    },

    handleSocketMessagesRead: ({ conversationId, messageId, readByUserId }) => {
        set((state) => {
            const updated = [...state.conversations];
            const index = updated.findIndex(c => String(c._id || c.id) === String(conversationId));

            if (index > -1) {
                const conv = { ...updated[index] };
                conv.participants = conv.participants.map(p => {
                    const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                    if (pId === String(readByUserId)) return { ...p, lastReadMessageId: messageId };
                    return p;
                });
                updated[index] = conv;
            }
            return { conversations: updated };
        });
    }
}));