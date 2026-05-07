import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {

    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);

    // JOIN ROOM
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

        // NEW MESSAGE
        socket.on("new_message", (message) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m.clientMessageId === message.clientMessageId);
                if (exists) {
                    return prev;
                }
                return [...prev, message];
            });
        }
        );

        // TYPING
        socket.on("typing", ({ userId, isTyping }) => {

            setTypingUsers((prev) => {

                if (isTyping) {

                    if (
                        prev.includes(userId)
                    ) {
                        return prev;
                    }

                    return [
                        ...prev,
                        userId
                    ];
                }

                return prev.filter(
                    (id) =>
                        id !== userId
                );
            });
        }
        );

        // READ RECEIPT
        socket.on("messages_read", ({ messageId, readByUserId }) => {

            setMessages((prev) =>
                prev.map((msg) => {

                    if (
                        msg._id === messageId
                    ) {

                        return {
                            ...msg,

                            readBy: [
                                ...(msg.readBy || []),
                                readByUserId
                            ]
                        };
                    }

                    return msg;
                })
            );
        }
        );

        return () => {

            socket.off("new_message");

            socket.off("typing");

            socket.off("messages_read");
        };

    }, [socket]);

    // SEND MESSAGE
    const sendMessage = ({ conversationId, text, attachments = [] }) => {

        if (!socket) return;

        const tempMessage = {

            conversationId,

            text,

            attachments,

            clientMessageId:
                crypto.randomUUID(),

            createdAt:
                new Date().toISOString(),

            sending: true
        };

        // OPTIMISTIC UI
        setMessages((prev) => [
            ...prev,
            tempMessage
        ]);

        socket.emit("send_message", tempMessage, (response) => {

            if (!response.success) {

                // FAILED
                setMessages((prev) =>
                    prev.map((msg) => {

                        if (
                            msg.clientMessageId ===
                            tempMessage.clientMessageId
                        ) {

                            return {
                                ...msg,
                                failed: true,
                                sending: false
                            };
                        }

                        return msg;
                    })
                );

                return;
            }

            // SUCCESS
            setMessages((prev) =>
                prev.map((msg) => {

                    if (
                        msg.clientMessageId ===
                        tempMessage.clientMessageId
                    ) {

                        return {
                            ...msg,
                            sending: false,
                            _id: response.messageId
                        };
                    }

                    return msg;
                })
            );
        }
        );
    };

    // TYPING
    const sendTyping = (conversationId, isTyping) => {

        if (!socket) return;

        socket.emit("typing", { conversationId, isTyping });
    };

    // MARK READ
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
        throw new Error("useChat must be used inside provider");
    }

    return context;
};