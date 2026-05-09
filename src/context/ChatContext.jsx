import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext"; 
import { useConversation } from "./ConversationContext"; 
import { messageApi } from "../api/messageApi"; 

const ChatContext = createContext(null);
const MESSAGES_PER_PAGE = 20;

export const ChatProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth(); 
  const { activeConversation } = useConversation();
  
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Pagination States
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Prevent React closure bugs inside socket listeners
  const activeConvRef = useRef(activeConversation);

  // ALWAYS keep the ref strictly synced with the active conversation
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);
  
  // 1. Fetch History & Handle State Reset
  useEffect(() => {
    // Instantly clear old chat data to prevent flashing
    setMessages([]);
    setTypingUsers([]);
    setHasMore(true); 
    
    if (!activeConversation) return;

    let isMounted = true; 
    setIsLoadingMessages(true);

    const fetchHistory = async () => {
      try {
        const res = await messageApi.getMessages(activeConversation, { limit: MESSAGES_PER_PAGE });
        if (isMounted) {
          const fetchedMessages = res.data?.data || res.data || [];
          setMessages(fetchedMessages);
          
          if (fetchedMessages.length < MESSAGES_PER_PAGE) {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false; 
    };
  }, [activeConversation]);

  // 2. Load More Messages (Pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isFetchingMore || !messages.length || !activeConversation) return;

    setIsFetchingMore(true);
    try {
      const oldestMessageId = messages[0]._id || messages[0].clientMessageId; 
      
      const res = await messageApi.getMessages(activeConversation, { 
        limit: MESSAGES_PER_PAGE,
        before: oldestMessageId 
      });
      
      const olderMessages = res.data?.data || res.data || [];
      
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      }
      
      if (olderMessages.length < MESSAGES_PER_PAGE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch older messages:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, messages, activeConversation]);

  // 3. Delete Message Action
  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._id === messageId || msg.clientMessageId === messageId) {
          return {
            ...msg,
            isDeleted: true,
            content: { ...msg.content, text: "This message was deleted", attachments: [] },
            text: "This message was deleted"
          };
        }
        return msg;
      })
    );

    try {
      await messageApi.deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  // 4. Room Management
  useEffect(() => {
    if (!socket || !activeConversation) return;
    socket.emit("join_conversation", activeConversation);
    return () => socket.emit("leave_conversation", activeConversation);
  }, [socket, activeConversation]);

  // 5. Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // FIX: Force String comparison because MongoDB ObjectIDs occasionally fail strict equality!
      if (String(message.conversationId) !== String(activeConvRef.current)) return;
      
      setMessages((prev) => {
        const exists = prev.some((m) => m.clientMessageId === message.clientMessageId || m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      const myId = String(user?.id || user?._id);
      if (String(message.senderId) !== myId) {
        socket.emit("mark_read", {
          conversationId: message.conversationId,
          messageId: message._id || message.clientMessageId
        });
      }
    };

    const handleTyping = ({ userId, isTyping, conversationId }) => {
      if (String(conversationId) !== String(activeConvRef.current)) return;

      setTypingUsers((prev) => {
        if (isTyping) return prev.includes(userId) ? prev : [...prev, userId];
        return prev.filter((id) => id !== userId);
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId || msg.clientMessageId === messageId) {
            return {
              ...msg,
              isDeleted: true,
              content: { ...msg.content, text: "This message was deleted", attachments: [] },
              text: "This message was deleted"
            };
          }
          return msg;
        })
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [socket, user]);

  // 6. Sending Data
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
    <ChatContext.Provider value={{ 
      messages, 
      setMessages, 
      typingUsers, 
      sendMessage, 
      sendTyping, 
      isLoadingMessages,
      loadMoreMessages, 
      hasMore,          
      isFetchingMore,
      deleteMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
};