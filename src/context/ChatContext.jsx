import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext"; 
import { useConversation } from "./ConversationContext"; 
import { messageApi } from "../api/messageApi"; 

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth(); 
    const { activeConversation } = useConversation();
    
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // Prevent React closure bugs inside socket listeners
    const activeConvRef = useRef(activeConversation);
    
    // Fetch History
    useEffect(() => {
        activeConvRef.current = activeConversation;
        if (!activeConversation) return;

        const fetchHistory = async () => {
            try {
                const res = await messageApi.getMessages(activeConversation);
                setMessages(res.data?.data || res.data || []);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };
        fetchHistory();
    }, [activeConversation]);

    // Room Management
    useEffect(() => {
        if (!socket || !activeConversation) return;
        socket.emit("join_conversation", activeConversation);
        return () => socket.emit("leave_conversation", activeConversation);
    }, [socket, activeConversation]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            if (message.conversationId !== activeConvRef.current) return;
            setMessages((prev) => {
                const exists = prev.some((m) => m.clientMessageId === message.clientMessageId || m._id === message._id);
                if (exists) return prev;
                return [...prev, message];
            });
        };

        const handleTyping = ({ userId, isTyping, conversationId }) => {
            if (conversationId !== activeConvRef.current) return;
            setTypingUsers((prev) => {
                if (isTyping) return prev.includes(userId) ? prev : [...prev, userId];
                return prev.filter((id) => id !== userId);
            });
        };

        socket.on("new_message", handleNewMessage);
        socket.on("typing", handleTyping);

        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("typing", handleTyping);
        };
    }, [socket]);

    const sendMessage = ({ conversationId, text, attachments = [] }) => {
        if (!socket) return;

        const currentUserId = user?.id || user?._id;

        const tempMessage = {
            conversationId,
            text,
            attachments,
            senderId: currentUserId, // Safely aligns to right side via Optimistic UI
            clientMessageId: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            sending: true
        };

        setMessages((prev) => [...prev, tempMessage]);

        socket.emit("send_message", tempMessage, (response) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg.clientMessageId === tempMessage.clientMessageId) {
                        return { ...msg, sending: false, failed: !response.success, _id: response.messageId || msg._id };
                    }
                    return msg;
                })
            );
        });
    };

    const sendTyping = (conversationId, isTyping) => {
        if (!socket) return;
        socket.emit("typing", { conversationId, isTyping });
    };

    return (
        <ChatContext.Provider value={{ messages, setMessages, typingUsers, sendMessage, sendTyping }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used inside ChatProvider");
    return context;
};