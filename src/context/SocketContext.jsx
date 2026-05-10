import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    const userId = String(user?.id || user?._id || '');

    useEffect(() => {
        if (!userId) {
            disconnectSocket();
            setSocket(null);
            setOnlineUsers(new Set());
            return;
        }

        const socketInstance = connectSocket();
        setSocket(socketInstance);

        const handleConnect = () => {
            setConnected(true);
            console.log("Socket connected");
        };

        const handleDisconnect = () => {
            setConnected(false);
            console.log("Socket disconnected");
            setOnlineUsers(new Set());
        };

        const handleUserOnline = ({ userId: onlineId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.add(String(onlineId));
                return next;
            });
        };

        const handleUserOffline = ({ userId: offlineId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(String(offlineId));
                return next;
            });
        };

        socketInstance.on("connect", handleConnect);
        socketInstance.on("disconnect", handleDisconnect);
        socketInstance.on("user_online", handleUserOnline);
        socketInstance.on("user_offline", handleUserOffline);

        return () => {
            socketInstance.off("connect", handleConnect);
            socketInstance.off("disconnect", handleDisconnect);
            socketInstance.off("user_online", handleUserOnline);
            socketInstance.off("user_offline", handleUserOffline);
            disconnectSocket();
        };
    }, [userId]);

    const checkUserOnline = useCallback((targetUserId) => {
        if (!socket || !targetUserId) return;
        socket.emit("check_online", String(targetUserId), (response) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (response?.online) {
                    next.add(String(targetUserId));
                } else {
                    next.delete(String(targetUserId));
                }
                return next;
            });
        });
    }, [socket]);

    const contextValue = useMemo(() => ({
        socket,
        connected,
        onlineUsers,
        checkUserOnline
    }), [socket, connected, onlineUsers, checkUserOnline]);

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within a SocketProvider");
    return context;
};