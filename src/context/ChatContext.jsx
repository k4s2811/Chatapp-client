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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Prevent React closure bugs inside socket listeners
  const activeConvRef = useRef(activeConversation);
  
  // Fetch History & Handle State Reset
  useEffect(() => {
    activeConvRef.current = activeConversation;
    
    // Instantly clear old chat data to prevent flashing
    setMessages([]);
    setTypingUsers([]);
    
    if (!activeConversation) return;

    let isMounted = true; // Prevents race conditions from rapid switching
    setIsLoadingMessages(true);

    const fetchHistory = async () => {
      try {
        const res = await messageApi.getMessages(activeConversation);
        // Only update if we haven't switched to a different chat while waiting
        if (isMounted) {
          setMessages(res.data?.data || res.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    fetchHistory();

    // Cleanup function runs when activeConversation changes
    return () => {
      isMounted = false; 
    };
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
      senderId: currentUserId,
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
    <ChatContext.Provider value={{ messages, setMessages, typingUsers, sendMessage, sendTyping, isLoadingMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
};