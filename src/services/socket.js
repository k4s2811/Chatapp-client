import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {

    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    if (socket?.connected) return socket;

    socket = io("/",{
        auth: {
            token
        },
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {

    if (socket) {
        socket.disconnect();
        socket = null;
    }
};