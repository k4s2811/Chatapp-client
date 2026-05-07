import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext"; // <-- 1. Import useAuth

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth(); // <-- 2. Get the logged-in user
    
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);

    // Keep a fresh reference of the active conversation for socket listeners
    const activeConvRef = useRef(activeConversation);
    useEffect(() => {
        activeConvRef.current = activeConversation;
    }, [activeConversation]);

    // ROOM MANAGEMENT: Join and Leave
    useEffect(() => {
        if (!socket || !activeConversation) return;

        socket.emit("join_conversation", activeConversation);

        return () => {
            socket.emit("leave_conversation", activeConversation);
        };
    }, [socket, activeConversation]);

    // SOCKET LISTENERS
    useEffect(() => {
        if (!socket) return;

        // NEW MESSAGE LISTENER
        const handleNewMessage = (message) => {
            if (message.conversationId !== activeConvRef.current) return;

            setMessages((prev) => {
                const exists = prev.some((m) => 
                    m.clientMessageId === message.clientMessageId || 
                    m._id === message._id
                );
                if (exists) return prev;
                return [...prev, message];
            });
        };

        // TYPING LISTENER
        const handleTyping = ({ userId, isTyping, conversationId }) => {
            if (conversationId !== activeConvRef.current) return;

            setTypingUsers((prev) => {
                if (isTyping) {
                    return prev.includes(userId) ? prev : [...prev, userId];
                }
                return prev.filter((id) => id !== userId);
            });
        };

        // READ RECEIPT LISTENER
        const handleMessagesRead = ({ messageId, readByUserId }) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg._id === messageId) {
                        return {
                            ...msg,
                            readBy: [...(msg.readBy || []), readByUserId]
                        };
                    }
                    return msg;
                })
            );
        };

        socket.on("new_message", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("messages_read", handleMessagesRead);

        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("messages_read", handleMessagesRead);
        };
    }, [socket]);

    // ACTION: SEND MESSAGE
    const sendMessage = ({ conversationId, text, attachments = [] }) => {
        if (!socket) return;

        // Extract ID safely
        const currentUserId = user?.id || user?._id;

        const tempMessage = {
            conversationId,
            text,
            attachments,
            senderId: currentUserId, // <-- 3. CRITICAL FIX: Attach your ID to the Optimistic UI!
            clientMessageId: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            sending: true
        };

        // Optimistic UI Update
        setMessages((prev) => [...prev, tempMessage]);

        socket.emit("send_message", tempMessage, (response) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg.clientMessageId === tempMessage.clientMessageId) {
                        return {
                            ...msg,
                            sending: false,
                            failed: !response.success,
                            _id: response.messageId || msg._id
                        };
                    }
                    return msg;
                })
            );
        });
    };

    // ACTION: SEND TYPING STATUS
    const sendTyping = (conversationId, isTyping) => {
        if (!socket) return;
        socket.emit("typing", { conversationId, isTyping });
    };

    // ACTION: MARK MESSAGES AS READ
    const markAsRead = (conversationId, messageId) => {
        if (!socket) return;
        socket.emit("mark_read", { conversationId, messageId });
    };

    return (
        <ChatContext.Provider
            value={{
                messages,
                setMessages,
                typingUsers,
                activeConversation,
                setActiveConversation,
                sendMessage,
                sendTyping,
                markAsRead
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used inside a ChatProvider");
    }
    return context;
};