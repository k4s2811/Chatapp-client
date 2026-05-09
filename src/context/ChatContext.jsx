import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { useConversation } from "./ConversationContext";
import { messageApi } from "../api/messageApi";

const ChatContext = createContext(null);
const MESSAGES_PER_PAGE = 20; // Set limit for pagination

export const ChatProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { activeConversation } = useConversation();

  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // --- NEW STATES FOR PAGINATION ---
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Prevent React closure bugs inside socket listeners
  const activeConvRef = useRef(activeConversation);

  // Fetch History & Handle State Reset
  useEffect(() => {
    activeConvRef.current = activeConversation;

    // Instantly clear old chat data to prevent flashing
    setMessages([]);
    setTypingUsers([]);
    setHasMore(true); // Reset pagination state

    if (!activeConversation) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    const fetchHistory = async () => {
      try {
        // Fetch with limit
        const res = await messageApi.getMessages(activeConversation, { limit: MESSAGES_PER_PAGE });
        if (isMounted) {
          const fetchedMessages = res.data?.data || res.data || [];
          setMessages(fetchedMessages);

          // If the backend returns fewer messages than requested, we've reached the top
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

  // --- NEW: Load More Messages Function ---
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isFetchingMore || !messages.length || !activeConversation) return;

    setIsFetchingMore(true);
    try {
      // The oldest message currently in state is at index 0
      const oldestMessageId = messages[0]._id;

      const res = await messageApi.getMessages(activeConversation, {
        limit: MESSAGES_PER_PAGE,
        before: oldestMessageId
      });

      const olderMessages = res.data?.data || res.data || [];

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      }

      // Stop fetching if we received fewer messages than the limit
      if (olderMessages.length < MESSAGES_PER_PAGE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch older messages:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, messages, activeConversation]);

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

      // --- Mark message as read instantly if we are staring at this chat ---
      const myId = String(user?.id || user?._id);
      if (String(message.senderId) !== myId) {
        socket.emit("mark_read", {
          conversationId: message.conversationId,
          messageId: message._id || message.clientMessageId
        });
      }
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
  }, [socket, user]);

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
      loadMoreMessages, // Exported to be used in ChatWindow
      hasMore,          // Exported to be used in ChatWindow
      isFetchingMore    // Exported to be used in ChatWindow
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