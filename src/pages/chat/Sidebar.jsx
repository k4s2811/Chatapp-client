import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { ThemeToggle } from '../../components/ThemeToggle.jsx';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useConversation } from '../../context/ConversationContext';
import { useSocket } from '../../context/SocketContext'; // <-- Import socket to listen for typing

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

const Sidebar = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const {
    conversations,
    activeConversation,
    startOrSelectConversation,
    isLoading
  } = useConversation();

  const [searchTerm, setSearchTerm] = useState('');

  const [typingData, setTypingData] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ conversationId, isTyping, userId }) => {
      const myId = String(currentUser?.id || currentUser?._id);
      if (String(userId) === myId) return;

      setTypingData((prev) => ({
        ...prev,
        [conversationId]: isTyping
      }));
    };

    socket.on("typing", handleTyping);
    return () => socket.off("typing", handleTyping);
  }, [socket, currentUser]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch { return ''; }
  };

  const formattedConversations = useMemo(() => {
    if (!conversations?.length || !currentUser) return [];

    const currentUserId = String(currentUser.id || currentUser._id);
    const searchLower = searchTerm.toLowerCase();

    return conversations
      .map(conv => {
        const otherParticipant = conv.participants?.find(p => {
          const pId = p.userId?._id || p.userId?.id || p.userId || p._id || p.id;
          return String(pId) !== currentUserId;
        });

        if (!otherParticipant) return null;

        const otherUser = typeof otherParticipant.userId === 'object' && otherParticipant.userId?.email
          ? otherParticipant.userId
          : { id: otherParticipant.userId, name: 'Unknown', email: 'Unknown' };

        const displayName = otherUser.name || otherUser.email?.split('@')[0] || 'Unknown User';
        const lastMessageText = conv.lastMessage?.content || "Started a conversation";
        const convIdStr = String(conv._id || conv.id);

        return {
          id: convIdStr,
          rawUser: otherUser,
          displayName,
          avatar: otherUser.avatar_url || otherUser.avatar,
          lastMessageText,
          timestamp: conv.lastMessage?.createdAt || conv.createdAt || conv.updatedAt,
          hasUnread: conv.hasUnread || false,
          isTyping: typingData[convIdStr] || false // Attach typing state to the conversation
        };
      })
      .filter(Boolean)
      .filter(item => {
        if (!searchTerm) return true;
        return (
          item.displayName.toLowerCase().includes(searchLower) ||
          item.lastMessageText.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [conversations, currentUser, searchTerm, typingData]);

  return (
    <div className="w-[320px] md:w-[380px] flex flex-col border-r border-sidebar-border shrink-0 bg-sidebar text-sidebar-foreground h-full" data-testid="sidebar">

      <div className="p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Chats
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted border-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border pb-safe">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <ConversationSkeleton key={i} />)
        ) : formattedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No conversations found.</p>
          </div>
        ) : (
          formattedConversations.map((chat) => {
            const isSelected = String(activeConversation) === chat.id;

            return (
              <motion.button
                key={chat.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => startOrSelectConversation(chat.rawUser)}
                className={`w-full rounded-xl flex items-center gap-3 p-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors text-left ${isSelected ? 'bg-sidebar-accent border-l-4 border-l-primary pl-2' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar || undefined} alt={chat.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium uppercase">
                      {chat.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate text-foreground">{chat.displayName}</h3>
                    <span className={`text-[11px] shrink-0 ml-2 ${chat.hasUnread && !isSelected ? 'text-primary font-bold' : 'text-muted-foreground font-medium'}`}>
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    
                    {chat.isTyping ? (
                      <p className="text-sm truncate flex-1 text-primary font-medium italic animate-pulse">
                        typing...
                      </p>
                    ) : (
                      <p className={`text-sm truncate flex-1 ${chat.hasUnread && !isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {chat.lastMessageText}
                      </p>
                    )}

                    {chat.hasUnread && !isSelected && (
                      <span className="shrink-0 w-2.5 h-2.5 bg-primary rounded-full mt-0.5 shadow-sm" aria-label="Unread message" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;