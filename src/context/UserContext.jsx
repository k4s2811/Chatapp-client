import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/auth';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const { user: currentUser } = useAuth(); 
    const [users, setUsers] = useState([]); 
    const [userMap, setUserMap] = useState({}); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchAllUsers = useCallback(async () => {
        if (!currentUser) return;
        
        setLoading(true);
        try {
            const res = await usersApi.getAllUsers();
            // Adjust `.data.data` based on your exact express response format
            const userList = res.data?.data || res.data || []; 
            
            // Filter out the current user so they don't chat with themselves
            const otherUsers = userList.filter(u => u._id !== currentUser._id);
            setUsers(otherUsers);

            // Create a lookup map: { "userId123": { name: "John", ... } }
            // This is super helpful when mapping over messages to find the sender's details
            const map = {};
            userList.forEach(u => {
                map[u._id] = u;
            });
            setUserMap(map);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Fetch specific users by IDs (Useful if someone joins a group and you don't have their profile)
    const fetchUsersByIds = useCallback(async (ids) => {
        if (!ids || ids.length === 0) return [];
        try {
            const res = await usersApi.getUsersByIds(ids.join(','));
            const fetchedUsers = res.data?.data || res.data || [];
            
            // Append newly fetched users to our existing dictionary map
            setUserMap(prev => {
                const newMap = { ...prev };
                fetchedUsers.forEach(u => {
                    newMap[u._id] = u;
                });
                return newMap;
            });
            return fetchedUsers;
        } catch (err) {
            console.error("Error fetching users by IDs", err);
            return [];
        }
    }, []);

    // Automatically fetch the user directory when the current user logs in
    useEffect(() => {
        if (currentUser) {
            fetchAllUsers();
        } else {
            // Clear out user data if logged out
            setUsers([]);
            setUserMap({});
        }
    }, [currentUser, fetchAllUsers]);

    return (
        <UserContext.Provider 
            value={{ 
                users, 
                userMap, 
                loading, 
                error, 
                fetchAllUsers, 
                fetchUsersByIds 
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUsers must be used within a UserProvider');
    return ctx;
};