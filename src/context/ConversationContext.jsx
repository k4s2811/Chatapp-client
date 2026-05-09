import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { conversationApi } from "../api/conversationApi";
import { usersApi } from "../api/auth"; // Ensure this path matches where getUsersByIds is!
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

    // Keep a fresh reference to prevent closure bugs in the socket listener
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
            // A. Fetch raw conversations
            const convRes = await conversationApi.getConversations();
            let fetchedConvs = convRes.data?.data || convRes.data || [];

            // B. Filter out empty conversations (Unless it's the one we just clicked)
            // Inside loadConversations()
            fetchedConvs = fetchedConvs.filter(conv => {
                // Make sure it actually has content, not just an empty object!
                const hasMessage = conv.lastMessage && conv.lastMessage.content;
                const isActive = String(conv._id || conv.id) === String(activeConvRef.current);
                return hasMessage || isActive;
            });

            // C. Find all unique user IDs we need to fetch
            const myId = String(currentUser.id || currentUser._id);
            const userIdsToFetch = new Set();

            fetchedConvs.forEach(conv => {
                conv.participants?.forEach(p => {
                    const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                    // Only fetch if it's not us, and if the ID hasn't already been populated into an object
                    if (pId !== myId && typeof p.userId !== 'object') {
                        userIdsToFetch.add(pId);
                    }
                });
            });

            const uniqueIds = Array.from(userIdsToFetch);

            // D. Batch fetch the user details using our fixed API route
            if (uniqueIds.length > 0) {
                const usersRes = await usersApi.getUsersByIds(uniqueIds);
                const usersList = usersRes.data?.data || usersRes.data || [];

                // Create a quick lookup dictionary: { "uuid-123": { name: "Zack", ... } }
                const usersMap = usersList.reduce((acc, user) => {
                    acc[String(user._id || user.id)] = user;
                    return acc;
                }, {});

                // E. Inject the populated User Objects back into the conversations array
                fetchedConvs.forEach(conv => {
                    conv.participants?.forEach(p => {
                        const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
                        if (usersMap[pId]) {
                            p.userId = usersMap[pId]; // Overwrite string ID with actual User Data!
                        }
                    });
                });
            }

            // Save the fully populated array to state
            setConversations(fetchedConvs);

        } catch (err) {
            console.error("Failed to fetch and populate sidebar data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    // Initial Load
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);


    // ==========================================
    // 2. REAL-TIME SOCKET LISTENER
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

                    // Only increment unread count if we are NOT currently looking at this chat
                    const myId = currentUser?.id || currentUser?._id;
                    if (
                        String(activeConvRef.current) !== String(message.conversationId) &&
                        String(message.senderId) !== String(myId)
                    ) {
                        conv.unreadCount = (conv.unreadCount || 0) + 1;
                        conv.isReadLocally = false;
                    }

                    updated.splice(index, 1);
                    updated.unshift(conv); // Push to top
                    return updated;
                } else {
                    // If a brand new conversation arrives via socket, fetch and populate it!
                    loadConversations();
                    return prev;
                }
            });
        };

        socket.on("new_message", handleNewMessage);
        return () => socket.off("new_message", handleNewMessage);
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

            setConversations(prev => {
                // 1. THE LOCAL SWEEP: Clean up stale empty chats instantly!
                // Remove any chat from the local array that doesn't have a real message,
                // EXCEPT the exact one we are opening right now.
                const cleanedPrev = prev.filter(c => {
                    const hasRealMessage = c.lastMessage && c.lastMessage.content;
                    const isBeingOpenedRightNow = String(c._id || c.id) === String(convId);
                    return hasRealMessage || isBeingOpenedRightNow;
                });

                const exists = cleanedPrev.find(c => String(c._id || c.id) === String(convId));

                if (exists) {
                    // Chat exists: clear the unread notification badge locally
                    return cleanedPrev.map(c => {
                        if (String(c._id || c.id) === String(convId)) {
                            return { ...c, unreadCount: 0, isReadLocally: true };
                        }
                        return c;
                    });
                } else {
                    // Brand new chat: Inject it locally
                    return [{
                        ...conversationData,
                        unreadCount: 0,
                        isReadLocally: true,
                        participants: [
                            { userId: formattedUser }, // The target user 
                            { userId: currentUser }    // Us
                        ]
                    }, ...cleanedPrev]; // <-- Use the cleaned array!
                }
            });

        } catch (err) {
            console.error("Error routing conversation:", err);
        }
    };

    // Clears the active chat so mobile can go "back" to the list view
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