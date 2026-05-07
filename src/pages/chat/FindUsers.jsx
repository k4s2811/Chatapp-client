import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { ThemeToggle } from '../../css/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const UserSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

const FindUsers = ({
  selectedUserId,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const { getAllUsers } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await getAllUsers(); 
        setUsers(res?.data?.data || res?.data || []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [getAllUsers]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!users.length) return [];

    const searchLower = searchTerm?.toLowerCase();

    return users.filter(user => {
      if (searchLower) {
        return (
          user?.email?.split('@')[0]?.toLowerCase().includes(searchLower) ||
          user?.bio?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [users, searchTerm]);

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
            Users
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 
          text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted 
            border-none focus:outline-none focus:ring-2 focus:ring-ring 
            text-foreground placeholder:text-muted-foreground transition-shadow"
            data-testid="search-users-input"
            aria-label="Search users"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 text-center text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Users List */}
      <div className="flex-1 overflow-y-auto" data-testid="users-list">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <UserSkeleton key={i} />)
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No users found.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userId = user.id || user._id;
            const isSelected = selectedUserId === userId;
            
            return (
              <button
                onContextMenu={(e) => e.preventDefault()}
                key={userId}
                // FIXED: Pass the entire user object securely
                onClick={() => onSelectUser?.(user)} 
                className={`w-full rounded-lg flex items-center gap-3 p-3 
                  border-b border-sidebar-border hover:bg-sidebar-accent 
                  hover:text-sidebar-accent-foreground transition-colors text-left
                   ${isSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                `}
                data-testid={`user-item-${userId}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.email || 'User'} />
                    <AvatarFallback className="bg-muted text-muted-foreground uppercase">
                      {user.email ? user.email[0] : '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">
                      {user.email?.split('@')[0] || 'Unknown'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.bio || 'No bio available'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindUsers;