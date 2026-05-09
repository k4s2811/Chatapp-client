import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { conversationApi } from "../api/conversationApi";
import { usersApi } from "../api/auth";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ConversationContext = createContext(null);

export const ConversationProvider = ({ children }) => {
    const { user: currentUser } = useAuth();
    const { socket } = useSocket();

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const activeConvRef = useRef(activeConversation);

    useEffect(() => {
        activeConvRef.current = activeConversation;
    }, [activeConversation]);

    // ==========================================
    // 1. CORE FETCH & POPULATE LOGIC
    // ==========================================
    const loadConversations = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);

        try {
            const convRes = await conversationApi.getConversations();
            let fetchedConvs = convRes.data?.data || convRes.data || [];
            const myId = String(currentUser.id || currentUser._id);

            fetchedConvs = fetchedConvs.map(conv => {
                const hasMessage = conv.lastMessage && conv.lastMessage.content;
                const isActive = String(conv._id || conv.id) === String(activeConvRef.current);
                if (!(hasMessage || isActive)) return null;

                const myParticipantRecord = conv.participants?.find(
                    p => String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id) === myId
                );
                
                const lastReadId = myParticipantRecord?.lastReadMessageId;
                const lastMsgId = conv.lastMessage?.messageId;
                const senderId = conv.lastMessage?.senderId;

                let hasUnread = false;
                if (lastMsgId && String(senderId) !== myId && String(lastReadId) !== String(lastMsgId)) {
                    hasUnread = true;
                }

                return { ...conv, hasUnread };
            }).filter(Boolean);

            const userIdsToFetch = new Set();

            fetchedConvs.forEach(conv => {
                conv.participants?.forEach(p => {
                    const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                    if (pId !== myId && typeof p.userId !== 'object') {
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
                        if (usersMap[pId]) {
                            p.userId = usersMap[pId]; 
                        }
                    });
                });
            }

            setConversations(fetchedConvs);

        } catch (err) {
            console.error("Failed to fetch and populate sidebar data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);


    // ==========================================
    // 2. REAL-TIME SOCKET LISTENERS
    // ==========================================
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setConversations((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(c =>
                    String(c._id) === String(message.conversationId) ||
                    String(c.id) === String(message.conversationId)
                );

                if (index > -1) {
                    const conv = { ...updated[index] };
                    conv.lastMessage = {
                        messageId: message._id || message.clientMessageId,
                        content: message.text || message.content?.text || "[Attachment]",
                        senderId: message.senderId,
                        createdAt: message.createdAt || new Date().toISOString()
                    };

                    const myId = currentUser?.id || currentUser?._id;
                    if (
                        String(activeConvRef.current) !== String(message.conversationId) &&
                        String(message.senderId) !== String(myId)
                    ) {
                        conv.hasUnread = true; 
                    }

                    updated.splice(index, 1);
                    updated.unshift(conv);
                    return updated;
                } else {
                    loadConversations();
                    return prev;
                }
            });
        };

        // --- NEW: Handle real-time read receipts from the other user ---
        const handleMessagesRead = ({ conversationId, messageId, readByUserId }) => {
            setConversations((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(c => String(c._id || c.id) === String(conversationId));

                if (index > -1) {
                    const conv = { ...updated[index] };
                    
                    // Update the specific participant's lastReadMessageId so the MessageBubble gets double ticks
                    conv.participants = conv.participants.map(p => {
                        const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                        if (pId === String(readByUserId)) {
                            return { ...p, lastReadMessageId: messageId };
                        }
                        return p;
                    });
                    
                    updated[index] = conv;
                }
                return updated;
            });
        };

        socket.on("new_message", handleNewMessage);
        socket.on("messages_read", handleMessagesRead);

        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("messages_read", handleMessagesRead);
        };
    }, [socket, currentUser, loadConversations]);


    // ==========================================
    // 3. ROUTING & CLICK HANDLERS
    // ==========================================
    const startOrSelectConversation = async (targetUser) => {
        const formattedUser = {
            id: targetUser._id || targetUser.id,
            name: targetUser.name || targetUser.email?.split('@')[0] || 'User',
            avatar: targetUser.avatar_url || targetUser.avatar || null,
        };

        setSelectedUser(formattedUser);

        try {
            const res = await conversationApi.createOrGetConversation(formattedUser.id);
            const conversationData = res.data?.data || res.data;
            const convId = conversationData._id || conversationData.id;

            setActiveConversation(convId);

            if (conversationData.lastMessage?.messageId) {
                // Inform the DB
                conversationApi.markConversationRead(convId, conversationData.lastMessage.messageId).catch(err => {
                    console.error("Failed to mark conversation as read:", err);
                });
                // Inform the other user in real-time
                if (socket) {
                    socket.emit("mark_read", { conversationId: convId, messageId: conversationData.lastMessage.messageId });
                }
            }

            setConversations(prev => {
                const cleanedPrev = prev.filter(c => {
                    const hasRealMessage = c.lastMessage && c.lastMessage.content;
                    const isBeingOpenedRightNow = String(c._id || c.id) === String(convId);
                    return hasRealMessage || isBeingOpenedRightNow;
                });

                const exists = cleanedPrev.find(c => String(c._id || c.id) === String(convId));

                if (exists) {
                    return cleanedPrev.map(c => {
                        if (String(c._id || c.id) === String(convId)) {
                            return { ...c, hasUnread: false }; 
                        }
                        return c;
                    });
                } else {
                    return [{
                        ...conversationData,
                        hasUnread: false,
                        participants: [
                            { userId: formattedUser }, 
                            { userId: currentUser }    
                        ]
                    }, ...cleanedPrev];
                }
            });

        } catch (err) {
            console.error("Error routing conversation:", err);
        }
    };

    const clearConversation = () => {
        setActiveConversation(null);
        setSelectedUser(null);
    };

    return (
        <ConversationContext.Provider value={{
            conversations, setConversations, activeConversation, setActiveConversation,
            selectedUser, setSelectedUser, startOrSelectConversation, isLoading,
            clearConversation
        }}>
            {children}
        </ConversationContext.Provider>
    );
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (!context) throw new Error("useConversation must be used inside Provider");
    return context;
};