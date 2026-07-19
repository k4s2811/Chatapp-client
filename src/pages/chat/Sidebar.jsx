import React, { useState, useMemo, useEffect, useDeferredValue, memo } from 'react';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useSocketStore } from '../../store/useSocketStore';
import { useChatStore } from '../../store/useChatStore';


const ConversationItem = memo(({ chat, isSelected, isTyping, isOnline, onClick }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(chat.rawUser)}
      className={`w-full rounded-xl flex items-center gap-3 p-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors text-left ${isSelected ? 'bg-sidebar-accent border-l-4 border-l-primary pl-2' : 'border-l-4 border-l-transparent'
        }`}
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.avatar || undefined} alt={chat.displayName} loading="lazy" />
          <AvatarFallback className="bg-primary/10 text-primary font-medium uppercase">
            {chat.displayName?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-sidebar rounded-full" aria-label="Online" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium truncate text-foreground">{chat.displayName}</h3>
          <span className={`text-[11px] shrink-0 ml-2 ${chat.hasUnread && !isSelected ? 'text-primary font-bold' : 'text-muted-foreground font-medium'}`}>
            {formatTime(chat.timestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
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
});

ConversationItem.displayName = 'ConversationItem';

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

// ... your imports are perfect

export default function Sidebar() {
  const currentUser = useAuthStore(state => state.user);
  const onlineUsers = useSocketStore(state => state.onlineUsers);
  const conversations = useConversationStore(state => state.conversations);
  const activeConversation = useConversationStore(state => state.activeConversation);
  const startOrSelectConversation = useConversationStore(state => state.startOrSelectConversation);
  const isLoading = useConversationStore(state => state.isLoading);
  const loadConversations = useConversationStore(state => state.loadConversations);
  // Centralized typing state (populated by the single SocketManager listener).
  const typingByConversation = useChatStore(state => state.typingByConversation);

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Clean, unified formatting & filtering logic
  const formattedConversations = useMemo(() => {
    if (!conversations?.length || !currentUser) return [];

    const currentUserId = String(currentUser.id || currentUser._id);
    const searchLower = deferredSearchTerm.toLowerCase();

    return conversations
      .map(conv => {
        // Find the other party safely normalizing potential participant ID configurations
        const otherParticipant = conv.participants?.find(p => {
          const pId = p.userId?._id || p.userId?.id || p.userId || p._id || p.id;
          return String(pId) !== currentUserId;
        });

        if (!otherParticipant) return null;

        // Build target user details normalizing MongoDB schemas
        const isUserObj = typeof otherParticipant.userId === 'object' && otherParticipant.userId !== null;
        const otherUser = isUserObj
          ? {
            id: String(otherParticipant.userId._id || otherParticipant.userId.id),
            name: otherParticipant.userId.name,
            email: otherParticipant.userId.email,
            avatar: otherParticipant.userId.avatar || otherParticipant.userId.avatar_url
          }
          : {
            id: String(otherParticipant.userId || otherParticipant._id || otherParticipant.id),
            name: 'Unknown',
            email: 'Unknown'
          };

        const displayName = otherUser.name || otherUser.email?.split('@')[0] || 'Unknown User';
        const hasLast = !!conv.lastMessage?.content;
        const isOwnLast = hasLast && String(conv.lastMessage.senderId) === currentUserId;
        const lastMessageText = hasLast
          ? (isOwnLast ? `You: ${conv.lastMessage.content}` : conv.lastMessage.content)
          : "Started a conversation";
        const convIdStr = String(conv._id || conv.id);

        return {
          id: convIdStr,
          rawUser: otherUser,
          displayName,
          avatar: otherUser.avatar,
          lastMessageText,
          timestamp: conv.lastMessage?.createdAt || conv.createdAt || conv.updatedAt,
          hasUnread: conv.hasUnread || false,
        };
      })
      .filter(Boolean)
      .filter(item => {
        if (!deferredSearchTerm) return true;
        return (
          item.displayName.toLowerCase().includes(searchLower) ||
          item.lastMessageText.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => (new Date(b.timestamp).getTime() || 0) - (new Date(a.timestamp).getTime() || 0));
  }, [conversations, currentUser, deferredSearchTerm]);

  return (
    <div className="w-full h-full flex flex-col border-none shrink-0 bg-sidebar text-sidebar-foreground" data-testid="sidebar">
      <div className="p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Chats
          </h1>
          <div className="flex items-center gap-2">
            {/* Any button */}
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
          formattedConversations.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isSelected={activeConversation ? String(activeConversation._id || activeConversation.id || activeConversation) === chat.id : false}
              isTyping={(typingByConversation[chat.id] || []).length > 0}
              isOnline={onlineUsers.has(chat.rawUser.id)}
              onClick={startOrSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}