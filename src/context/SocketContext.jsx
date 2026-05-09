import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        if (!user) {
            disconnectSocket();
            setSocket(null);
            setOnlineUsers(new Set());
            return;
        }

        const socketInstance = connectSocket();
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
            setConnected(true);
            console.log("Socket connected");
        });

        socketInstance.on("disconnect", () => {
            setConnected(false);
            console.log("Socket disconnected");
            setOnlineUsers(new Set());
        });

        socketInstance.on("user_online", ({ userId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.add(String(userId));
                return next;
            });
        });

        socketInstance.on("user_offline", ({ userId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(String(userId));
                return next;
            });
        });

        return () => {
            socketInstance.off("connect");
            socketInstance.off("disconnect");
            socketInstance.off("user_online");
            socketInstance.off("user_offline");
            disconnectSocket();
        };

    }, [user]);

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

    return (
        <SocketContext.Provider
            value={{
                socket,
                connected,
                onlineUsers,
                checkUserOnline
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be inside provider");
    return context;
};