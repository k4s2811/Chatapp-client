import { useEffect, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useConversationStore } from '../store/useConversationStore';
import { useChatStore } from '../store/useChatStore';

export default function SocketManager() {
    const socket = useSocketStore(state => state.socket);
    const connected = useSocketStore(state => state.connected);
    const initSocket = useSocketStore(state => state.initSocket);
    const activeConversation = useConversationStore(state => state.activeConversation);
    const hasJoinedRef = useRef(false);

    // 1. Initialize socket when user logs in
    useEffect(() => {
        initSocket();
    }, [initSocket]);

    // 2. Global Socket Listeners mapped to Zustand
    useEffect(() => {
        if (!socket) return;
        const { handleSocketNewMessage: handleConvNewMsg, handleSocketMessagesRead } = useConversationStore.getState();
        const { handleSocketNewMessage: handleChatNewMsg, handleSocketTyping, handleSocketMessageDeleted } = useChatStore.getState();

        const onNewMessage = (msg) => { handleChatNewMsg(msg); handleConvNewMsg(msg); };

        socket.on("new_message", onNewMessage);
        socket.on("messages_read", handleSocketMessagesRead);
        socket.on("typing", handleSocketTyping);
        socket.on("message_deleted", handleSocketMessageDeleted);

        return () => {
            socket.off("new_message", onNewMessage);
            socket.off("messages_read", handleSocketMessagesRead);
            socket.off("typing", handleSocketTyping);
            socket.off("message_deleted", handleSocketMessageDeleted);
        };
    }, [socket]);

    // 3. Room Joining — re-joins on socket reconnect (connected flips false→true)
    // connected is in deps so this re-fires after a disconnect/reconnect cycle,
    // re-emitting join_conversation so the server re-adds us to the room.
    // The hasJoinedRef guard prevents a redundant fetchHistory on reconnect,
    // while remaining false on conversation switch so fetchHistory runs then.
    useEffect(() => {
        if (!socket || !activeConversation) return;

        socket.emit("join_conversation", activeConversation);

        if (!hasJoinedRef.current) {
            hasJoinedRef.current = true;
            useChatStore.getState().fetchHistory(activeConversation);
        }

        return () => {
            socket.emit("leave_conversation", activeConversation);
            useChatStore.getState().clearMessages();
            hasJoinedRef.current = false;
        };
    }, [socket, activeConversation, connected]);

    return null;
}