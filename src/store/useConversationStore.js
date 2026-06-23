import { create } from 'zustand';
import { conversationApi } from '../api/conversationApi';
import { usersApi } from '../api/auth';
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';

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
                const hasMessage = conv.lastMessage && conv.lastMessage.content;
                const isActive = String(conv._id || conv.id) === String(get().activeConversation);
                if (!(hasMessage || isActive)) return null;

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

                return { ...conv, hasUnread };
            }).filter(Boolean);

            // Fetch missing user details
            const userIdsToFetch = new Set();
            fetchedConvs.forEach(conv => {
                conv.participants?.forEach(p => {
                    const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                    if (pId !== currentUserId && typeof p.userId !== 'object') {
                        userIdsToFetch.add(pId);
                    }
                });
            });

            const uniqueIds = Array.from(userIdsToFetch);
            if (uniqueIds.length > 0) {
                const usersRes = await usersApi.getUsersByIds(uniqueIds);
                const usersList = usersRes.data?.data || usersRes.data || [];

                const usersMap = usersList.reduce((acc, user) => {
                    acc[String(user._id || user.id)] = user;
                    return acc;
                }, {});

                fetchedConvs.forEach(conv => {
                    conv.participants?.forEach(p => {
                        const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                        if (usersMap[pId]) p.userId = usersMap[pId]; 
                    });
                });
            }

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

        set({ selectedUser: formattedUser });

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
            const cleanedPrev = currentConvs.filter(c => {
                const hasRealMessage = c.lastMessage && c.lastMessage.content;
                const isBeingOpenedRightNow = String(c._id || c.id) === String(convId);
                return hasRealMessage || isBeingOpenedRightNow;
            });

            const exists = cleanedPrev.find(c => String(c._id || c.id) === String(convId));

            if (exists) {
                set({ conversations: cleanedPrev.map(c => 
                    String(c._id || c.id) === String(convId) ? { ...c, hasUnread: false } : c
                )});
            } else {
                set({ conversations: [{
                    ...conversationData,
                    hasUnread: false,
                    participants: [{ userId: formattedUser }, { userId: currentUser }]
                }, ...cleanedPrev] });
            }
        } catch (err) {
            console.error("Error routing conversation:", err);
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