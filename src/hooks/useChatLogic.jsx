import { useState, useEffect, useCallback } from 'react';
import { mockUsers, mockConversations, mockMessages } from '../data/mockData';

export const useChatLogic = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [users, setUsers] = useState(mockUsers);
  const [messages, setMessages] = useState(mockMessages);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const getConversationUser = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return null;
    return users.find(u => u.id === conversation.userId);
  }, [conversations, users]);

  const getConversationMessages = useCallback((conversationId) => {
    return messages[conversationId] || [];
  }, [messages]);

  const sendMessage = useCallback((conversationId, text) => {
    const newMessage = {
      id: Date.now(),
      text,
      senderId: "me",
      timestamp: new Date(),
      delivered: false,
      read: false
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    // Update conversation's last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: text, timestamp: new Date() }
          : conv
      )
    );

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId].map(msg =>
          msg.id === newMessage.id ? { ...msg, delivered: true } : msg
        )
      }));
    }, 500);

    // Simulate typing response
    const user = getConversationUser(conversationId);
    if (user && user.online) {
      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [conversationId]: true }));
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, typing: true } : u
        ));
      }, 1000);

      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [conversationId]: false }));
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, typing: false } : u
        ));
        
        const responses = [
          "That sounds great!",
          "I agree with you.",
          "Let me think about that.",
          "Sure thing!",
          "Absolutely!"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage = {
          id: Date.now(),
          text: randomResponse,
          senderId: user.id,
          timestamp: new Date(),
          delivered: true,
          read: false
        };

        setMessages(prev => ({
          ...prev,
          [conversationId]: [...prev[conversationId], responseMessage]
        }));

        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, lastMessage: randomResponse, timestamp: new Date(), unreadCount: conv.unreadCount + 1 }
              : conv
          )
        );
      }, 3000);
    }
  }, [conversations, getConversationUser]);

  const markAsRead = useCallback((conversationId) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  const selectConversation = useCallback((conversationId) => {
    setSelectedConversationId(conversationId);
    markAsRead(conversationId);
  }, [markAsRead]);

  return {
    conversations,
    users,
    messages,
    selectedConversationId,
    typingUsers,
    isLoading,
    getConversationUser,
    getConversationMessages,
    sendMessage,
    selectConversation
  };
};

