import React from 'react';
import { Search, Moon, Sun, MessageSquarePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { ThemeToggle } from '../../components/ThemeToggle.jsx';
import { formatDistanceToNow } from 'date-fns';

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
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
  // const { theme, toggleTheme } = useTheme();

  const formatTime = (date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getUser = (userId) => users.find(u => u.id === userId);

  return (
    <div className="w-[320px] md:w-[380px] flex flex-col border-r border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900 h-screen" data-testid="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Chats
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              data-testid="new-chat-button"
            >
              <MessageSquarePlus size={18} className="text-neutral-600 dark:text-neutral-400" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
            data-testid="search-conversations-input"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto" data-testid="conversations-list">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
        ) : (
          conversations
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((conversation) => {
              const user = getUser(conversation.userId);
              if (!user) return null;

              const isSelected = selectedConversationId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  data-testid={`conversation-item-${conversation.id}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-50 truncate">
                        {user.name}
                      </h3>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate flex-1">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 shrink-0 min-w-[20px] h-5 px-2 flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium rounded-full" data-testid={`unread-count-${conversation.id}`}>
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
