import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatApi } from '../api/chat';
import { useAuth } from '../context/AuthContext';

export const useChatLogic = () => {
  const { user } = useAuth(); // Get logged-in user details
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Store socket in a ref so it doesn't trigger re-renders
  const socketRef = useRef(null);

  // 1. Initialize Socket and Fetch Initial Data
  useEffect(() => {
    if (!user) return;

    // Connect to Chat Microservice via Socket.IO
    const token = localStorage.getItem('accessToken');
    socketRef.current = io('http://localhost:3002', {
      auth: { token }
    });

    // Setup Socket Listeners
    socketRef.current.on('connect', () => console.log('Socket Connected!'));
    
    socketRef.current.on('new_message', (incomingMessage) => {
      const convId = incomingMessage.conversationId;
      
      // Add message to the correct conversation thread
      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), incomingMessage]
      }));

      // Update the sidebar snippet
      setConversations(prev => prev.map(conv => 
        conv._id === convId 
          ? { 
              ...conv, 
              lastMessage: { content: incomingMessage.content.text, createdAt: incomingMessage.createdAt },
              updatedAt: new Date()
            }
          : conv
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    });

    // Fetch initial sidebar conversations via REST
    const loadSidebar = async () => {
      try {
        const res = await chatApi.getConversations();
        setConversations(res.data.data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSidebar();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  // 2. Fetch Message History when clicking a chat
  const selectConversation = useCallback(async (conversationId) => {
    setSelectedConversationId(conversationId);
    
    // Join the socket room for typing indicators/read receipts
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conversationId);
    }

    // Only fetch REST history if we haven't loaded it yet
    if (!messages[conversationId]) {
      try {
        const res = await chatApi.getMessages(conversationId);
        setMessages(prev => ({
          ...prev,
          [conversationId]: res.data.data 
        }));
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    }
  }, [messages]);

  // 3. Send Message via Socket
  const sendMessage = useCallback((conversationId, text) => {
    if (!socketRef.current || !text.trim()) return;

    const payload = {
      conversationId,
      text
    };

    // Emit instantly
    socketRef.current.emit('send_message', payload, (response) => {
      if (!response.success) {
        console.error("Message failed to send", response.error);
        // You could add logic here to mark a message with a red "!" icon
      }
    });

    // Optimistic UI Update: Instantly show message on sender's screen
    const optimisticMessage = {
      _id: Date.now().toString(), // Temp ID
      conversationId,
      senderId: user.id, // From your Auth Context
      content: { text },
      createdAt: new Date(),
      status: 'sending'
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
    }));

  }, [user]);

  return {
    conversations,
    messages,
    selectedConversationId,
    isLoading,
    sendMessage,
    selectConversation,
    getConversationMessages: (id) => messages[id] || [],
  };
};