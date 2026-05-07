import { createContext, useContext, useState, useEffect, useRef } from "react";
import { conversationApi } from "../api/conversationApi";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ConversationContext = createContext(null);

export const ConversationProvider = ({ children }) => {
    const { user: currentUser, getAllUsers } = useAuth();
    const { socket } = useSocket();
    
    const [conversations, setConversations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Keep a fresh reference to prevent closure bugs in the socket listener
    const activeConvRef = useRef(activeConversation);
    useEffect(() => {
        activeConvRef.current = activeConversation;
    }, [activeConversation]);

    // Fetch conversations and all users
    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [convRes, usersRes] = await Promise.all([
                    conversationApi.getConversations(),
                    getAllUsers()
                ]);
                
                setConversations(convRes.data?.data || convRes.data || []);
                setAllUsers(usersRes.data?.data || usersRes.data || []);
            } catch (err) {
                console.error("Failed to fetch sidebar data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, getAllUsers]);

    // Socket Listener for new messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setConversations((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(c => c._id === message.conversationId);
                
                if (index > -1) {
                    const conv = { ...updated[index] }; // Clone to trigger React re-render
                    conv.lastMessage = {
                        messageId: message._id || message.clientMessageId,
                        content: message.text || message.content?.text || "[Attachment]",
                        senderId: message.senderId,
                        createdAt: message.createdAt || new Date().toISOString()
                    };

                    // Only increment unread count if we are NOT currently looking at this chat
                    const myId = currentUser?.id || currentUser?._id;
                    if (activeConvRef.current !== message.conversationId && message.senderId !== myId) {
                        conv.unreadCount = (conv.unreadCount || 0) + 1;
                        conv.isReadLocally = false;
                    }

                    updated.splice(index, 1);
                    updated.unshift(conv); // Push to top
                    return updated;
                } else {
                    conversationApi.getConversations().then(res => {
                        setConversations(res.data?.data || res.data || []);
                    });
                    return prev;
                }
            });
        };

        socket.on("new_message", handleNewMessage);
        return () => socket.off("new_message", handleNewMessage);
    }, [socket, currentUser]);

    // Handle clicks in Sidebar
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
            
            // Instantly clear the unread notification badge locally
            setConversations(prev => prev.map(c => {
                if (String(c._id) === String(convId) || String(c.id) === String(convId)) {
                    return { ...c, unreadCount: 0, isReadLocally: true };
                }
                return c;
            }));

            if (!conversations.find(c => c._id === convId)) {
                const refreshRes = await conversationApi.getConversations();
                setConversations(refreshRes.data?.data || refreshRes.data || []);
            }
        } catch (err) {
            console.error("Error routing conversation:", err);
        }
    };

    return (
        <ConversationContext.Provider value={{
            conversations, setConversations, allUsers, activeConversation, setActiveConversation,
            selectedUser, setSelectedUser, startOrSelectConversation, isLoading
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