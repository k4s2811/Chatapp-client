import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {

    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            disconnectSocket();
            setSocket(null);
            return;
        }

        const socketInstance = connectSocket();
        setSocket(socketInstance);

        socketInstance.on(
            "connect",
            () => {
                setConnected(true);
                console.log("Socket connected");
            }
        );

        socketInstance.on(
            "disconnect",
            () => {

                setConnected(false);
                console.log("Socket disconnected");
            }
        );

        return () => {
            disconnectSocket();
        };

    }, [user]);

    return (
        <SocketContext.Provider
            value={{
                socket,
                connected
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {

    const context =
        useContext(SocketContext);

    if (!context) {
        throw new Error(
            "useSocket must be inside provider"
        );
    }

    return context;
};