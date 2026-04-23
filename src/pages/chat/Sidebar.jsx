import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { ThemeToggle } from '../../css/ThemeToggle.jsx';
import { formatDistanceToNow } from 'date-fns';
// import { NewChat } from '../../components/new-chat';
import { motion } from 'framer-motion';

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

const Sidebar = ({
  conversations,
  users,
  selectedConversationId,
  onSelectConversation,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatTime = (date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const filteredAndSortedConversations = useMemo(() => {
    if (!conversations || !users) return [];

    const userMap = new Map(users.map(u => [u.id, u]));

    const searchLower = searchTerm?.toLowerCase();

    return [...conversations]
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(conversation => {
        const user = userMap.get(conversation.userId);
        if (!user) return false;
        if (searchLower) {
          return (
            user.name.toLowerCase().includes(searchLower) ||
            conversation.lastMessage.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .map(conversation => ({
        ...conversation,
        user: userMap.get(conversation.userId)
      }));
  }, [conversations, users, searchTerm]);

  return (
    <div className="w-[320px] md:w-[380px] flex flex-col 
    border-r border-sidebar-border shrink-0 bg-sidebar 
    text-sidebar-foreground h-screen" data-testid="sidebar">

      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold 
          tracking-tight text-sidebar-foreground"
            style={{ fontFamily: 'Manrope, sans-serif' }}>
            Chats
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* <NewChat /> */}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 
          text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted 
            border-none focus:outline-none focus:ring-2 focus:ring-ring 
            text-foreground placeholder:text-muted-foreground transition-shadow"
            data-testid="search-conversations-input"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto" data-testid="conversations-list">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
        ) : filteredAndSortedConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations found.
          </div>
        ) : (
          filteredAndSortedConversations.map((item) => {
            const { user, ...conversation } = item;
            const isSelected = selectedConversationId === conversation.id;

            return (
              <motion.button
                key={conversation.id}
                whileTap={{ scale: 0.96, y: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full rounded-xl flex items-center gap-3 p-3 
                  border-b border-sidebar-border hover:bg-sidebar-accent 
                  hover:text-sidebar-accent-foreground transition-colors 
                  ${isSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }`}
                data-testid={`conversation-item-${conversation.id}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 
                    bg-online border-2 border-sidebar rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">
                      {user.name}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTime(conversation.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 shrink-0 min-w-[20px] h-5 px-2 
                      flex items-center justify-center bg-primary 
                      text-primary-foreground text-xs font-medium rounded-full"
                        data-testid={`unread-count-${conversation.id}`}>
                        {conversation.unreadCount}
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