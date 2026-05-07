import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { ThemeToggle } from '../../css/ThemeToggle.jsx';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useConversation } from '../../context/ConversationContext';

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

const Sidebar = () => {
  const { user: currentUser } = useAuth();
  
  // 1. Pull the getConversations data directly from the new Context!
  const { 
      conversations, 
      allUsers, 
      activeConversation, 
      startOrSelectConversation, 
      isLoading 
  } = useConversation();
  
  const [searchTerm, setSearchTerm] = useState('');

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch { return ''; }
  };

  const formattedConversations = useMemo(() => {
    if (!conversations?.length || !allUsers?.length || !currentUser) return [];

    const currentUserId = currentUser.id || currentUser._id;
    const searchLower = searchTerm.toLowerCase();

    return conversations
      .map(conv => {
        // TYPE-SAFE FIND: Find the other person in the chat
        const otherParticipant = conv.participants?.find(p => String(p.userId) !== String(currentUserId));
        const otherUserDb = allUsers.find(u => String(u.id || u._id) === String(otherParticipant?.userId));

        if (!otherUserDb) return null;

        const displayName = otherUserDb.name || otherUserDb.email?.split('@')[0] || 'Unknown';
        const lastMessageText = conv.lastMessage?.content || "Started a conversation";
        
        let unreadCount = conv.unreadCount || 0; 

        // Verify against database if local socket hasn't caught anything yet
        if (unreadCount === 0 && conv.isReadLocally !== true) {
            const myParticipant = conv.participants?.find(p => String(p.userId) === String(currentUserId));
            
            if (
                conv.lastMessage?.senderId && 
                String(conv.lastMessage.senderId) !== String(currentUserId) && 
                String(conv.lastMessage.messageId) !== String(myParticipant?.lastReadMessageId)
            ) {
                unreadCount = 1;
            }
        }

        return {
          id: conv._id || conv.id,
          rawUser: otherUserDb, 
          displayName,
          avatar: otherUserDb.avatar_url,
          lastMessageText,
          timestamp: conv.lastMessage?.createdAt || conv.createdAt,
          unreadCount
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
  }, [conversations, allUsers, currentUser, searchTerm]);

  return (
    <div className="w-[320px] md:w-[380px] flex flex-col 
    border-r border-sidebar-border shrink-0 bg-sidebar 
    text-sidebar-foreground h-screen" data-testid="sidebar">

      <div className="p-4 border-b border-sidebar-border">
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
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted border-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
        ) : formattedConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No conversations found.</div>
        ) : (
          formattedConversations.map((chat) => {
            // Type-Safe selection highlight
            const isSelected = String(activeConversation) === String(chat.id);

            return (
              <motion.button
                key={chat.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => startOrSelectConversation(chat.rawUser)}
                className={`w-full rounded-xl flex items-center gap-3 p-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors text-left ${isSelected ? 'bg-sidebar-accent' : ''}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar} alt={chat.displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground uppercase">{chat.displayName[0]}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{chat.displayName}</h3>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate flex-1">{chat.lastMessageText}</p>
                    
                    {/* Unread Badge displays here */}
                    {chat.unreadCount > 0 && !isSelected && (
                      <span className="ml-2 shrink-0 min-w-[20px] h-5 px-2 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        {chat.unreadCount}
                      </span>
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