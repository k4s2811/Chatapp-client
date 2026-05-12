import { useEffect } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useConversationStore } from '../store/useConversationStore';
import { useChatStore } from '../store/useChatStore';

export default function SocketManager() {
    const socket = useSocketStore(state => state.socket);
    const initSocket = useSocketStore(state => state.initSocket);
    const activeConversation = useConversationStore(state => state.activeConversation);

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

    // 3. Room Joining
    useEffect(() => {
        if (!socket || !activeConversation) return;
        socket.emit("join_conversation", activeConversation);
        useChatStore.getState().fetchHistory(activeConversation);

        return () => {
            socket.emit("leave_conversation", activeConversation);
            useChatStore.getState().clearMessages();
        };
    }, [socket, activeConversation]);

    return null; 
}