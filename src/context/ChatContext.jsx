import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { chatApi } from '../api/chat';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

// Point directly to the Chat Service running on port 3002

export const ChatProvider = ({ children }) => {
    const { user, signout } = useAuth();

    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // ─── 1. SOCKET INITIALIZATION ──────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!user || !token) return;

        const newSocket = io({
            auth: { token }
        });


        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            if (err.message === "Authentication error: invalid token") {
                signout();
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, signout]);


    // ─── 2. FETCH CONVERSATIONS (SIDEBAR) ──────────────────────────────────
    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            const res = await chatApi.getConversations();
            // Fallback to empty array if data isn't structured as expected
            setConversations(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchConversations();
    }, [user, fetchConversations]);


    // ─── 3. SELECT CONVERSATION & FETCH MESSAGES ───────────────────────────
    const selectConversation = async (conversationId) => {
        setActiveConversationId(conversationId);
        setLoading(true);

        try {
            if (activeConversationId && socket) {
                socket.emit("leave_conversation", activeConversationId);
            }

            const res = await chatApi.getMessages(conversationId);
            setMessages(res.data?.data || res.data || []);

            if (socket) {
                socket.emit("join_conversation", conversationId);
            }
        } catch (error) {
            console.error("Failed to load messages", error);
        } finally {
            setLoading(false);
        }
    };


    // ─── 4. REAL-TIME MESSAGE LISTENER ─────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            if (message.conversationId === activeConversationId) {
                setMessages((prev) => [...prev, message]);

                if (message.senderId !== user?._id) {
                    socket.emit("mark_read", {
                        conversationId: activeConversationId,
                        messageId: message._id
                    });
                }
            }

            setConversations((prevConvs) =>
                prevConvs.map(conv =>
                    conv._id === message.conversationId
                        ? { ...conv, lastMessage: { content: message.content?.text || message.text, senderId: message.senderId } }
                        : conv
                ).sort((a, b) => {
                    if (a._id === message.conversationId) return -1;
                    if (b._id === message.conversationId) return 1;
                    return 0;
                })
            );
        };

        socket.on("new_message", handleNewMessage);

        return () => {
            socket.off("new_message", handleNewMessage);
        };
    }, [socket, activeConversationId, user]);


    // ─── 5. SEND MESSAGE HELPER ────────────────────────────────────────────
    const sendMessage = async (text) => {
        if (!activeConversationId || !socket) return;

        try {
            // Updated to use the socket event defined in your backend socketHandler.js
            const payload = {
                conversationId: activeConversationId,
                text,
                attachments: [],
                replyToMessageId: null
            };

            socket.emit("send_message", payload, (ack) => {
                if (!ack.success) {
                    console.error("Message failed to send:", ack.error);
                }
            });

        } catch (error) {
            console.error("Failed to emit message", error);
        }
    };

    return (
        <ChatContext.Provider
            value={{
                socket,
                conversations,
                fetchConversations,
                activeConversationId,
                selectConversation,
                messages,
                setMessages,
                loading,
                sendMessage
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within a ChatProvider');
    return ctx;
};