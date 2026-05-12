import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { usersApi } from '../../api/auth'; 

const UserSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

const FindUsers = ({ selectedUserId, onSelectUser }) => {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearch) {
        setPage(1);
        setDebouncedSearch(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  const fetchUsers = useCallback(async (pageNum, searchStr) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsFetchingMore(true);
    setError(null);

    try {
      const res = await usersApi.getAllUsers(pageNum, searchStr);
      const newUsers = res?.data?.data || res?.data || [];
      const pagination = res?.data?.pagination;

      setUsers(prev => pageNum === 1 ? newUsers : [...prev, ...newUsers]);

      if (pagination) {
        setHasMore(pageNum < pagination.totalPages);
      } else {
        setHasMore(newUsers.length > 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch, fetchUsers]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (!isLoading && !isFetchingMore && hasMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="w-full h-full flex flex-col border-none shrink-0 bg-sidebar text-sidebar-foreground" data-testid="find-users-panel">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold 
          tracking-tight text-sidebar-foreground"
            style={{ fontFamily: 'Manrope, sans-serif' }}>
            Find Users
          </h1>
          <div className="flex items-center gap-2">
            {/* Any button */}
          </div>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search all users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-full bg-muted 
            border-none focus:outline-none focus:ring-2 focus:ring-primary/50 
            text-foreground placeholder:text-muted-foreground transition-all"
            data-testid="search-users-input"
            aria-label="Search users"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-4 text-center text-red-500 text-sm bg-red-500/10 mx-4 mt-4 rounded-lg">{error}</div>}

      {/* Users List */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border pb-safe"
        onScroll={handleScroll}
        data-testid="users-list"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <UserSkeleton key={i} />)
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Search size={32} className="mb-2 opacity-20" />
            <p>No users found matching "{debouncedSearch}"</p>
          </div>
        ) : (
          <>
            {users.map((user) => {
              const userId = user.id || user._id;
              const isSelected = selectedUserId === userId;

              return (
                <button
                  key={userId}
                  onClick={() => onSelectUser?.(user)}
                  className={`w-full rounded-xl flex items-center gap-3 p-3 
                    border-b border-sidebar-border hover:bg-sidebar-accent 
                    transition-colors text-left 
                    ${isSelected ? 'bg-sidebar-accent border-l-4 border-l-primary pl-2' : 'border-l-4 border-l-transparent'}`}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.email || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium uppercase">
                      {user.email ? user.email[0] : '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-foreground">
                      {user.email?.split('@')[0] || 'Unknown'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">{user.bio || 'Available'}</p>
                  </div>
                </button>
              );
            })}

            {isFetchingMore && (
              <div className="p-4 flex justify-center text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FindUsers;