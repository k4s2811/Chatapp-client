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
    const joinedRoomsRef = useRef(new Set());

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

    // 3. Active Conversation — fetch history on first visit, clear messages on switch
    useEffect(() => {
        if (!socket || !activeConversation) return;

        if (!hasJoinedRef.current) {
            hasJoinedRef.current = true;
            useChatStore.getState().fetchHistory(activeConversation);
        }

        return () => {
            useChatStore.getState().clearMessages();
            hasJoinedRef.current = false;
        };
    }, [socket, activeConversation, connected]);

    // 4. Join ALL conversation rooms (for sidebar real-time updates: unread count, typing)
    //    Fires on connect/reconnect and subscribes to new conversations appearing in the store.
    useEffect(() => {
        if (!socket || !connected) return;

        joinedRoomsRef.current = new Set();

        const joinAllRooms = () => {
            const { conversations } = useConversationStore.getState();
            conversations.forEach(conv => {
                const convId = String(conv._id || conv.id);
                if (convId && !joinedRoomsRef.current.has(convId)) {
                    joinedRoomsRef.current.add(convId);
                    socket.emit("join_conversation", convId);
                }
            });
        };

        joinAllRooms();

        const unsub = useConversationStore.subscribe(joinAllRooms);

        return () => unsub();
    }, [socket, connected]);

    return null;
}