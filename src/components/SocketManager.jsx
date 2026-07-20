import { useEffect, useRef } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { useConversationStore } from '../store/useConversationStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth';

export default function SocketManager() {
    const socket = useSocketStore(state => state.socket);
    const connected = useSocketStore(state => state.connected);
    const initSocket = useSocketStore(state => state.initSocket);
    const activeConversation = useConversationStore(state => state.activeConversation);
    const joinedRoomsRef = useRef(new Set());
    const wasConnectedRef = useRef(false);

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

        // The server drops the socket when the access token expires or the
        // session is revoked. Try a one-shot refresh + reconnect; if that fails
        // (refresh token dead / revoked), the session is truly over — sign out.
        const onAuthError = async () => {
            try {
                const res = await authApi.refresh();
                const newToken = res.data?.data?.accessToken;
                if (!newToken) throw new Error('no token');
                localStorage.setItem('accessToken', newToken);
                socket.connect(); // auth callback re-reads the fresh token
            } catch {
                useSocketStore.getState().disconnect();
                useAuthStore.getState().signout();
            }
        };

        socket.on("new_message", onNewMessage);
        socket.on("messages_read", handleSocketMessagesRead);
        socket.on("typing", handleSocketTyping);
        socket.on("message_deleted", handleSocketMessageDeleted);
        socket.on("auth_error", onAuthError);
        socket.on("room_error", (err) => console.error("[Socket] Room error:", err.message));
        socket.on("connect_error", (err) => console.error("[Socket] Connection error:", err.message));

        return () => {
            socket.off("new_message", onNewMessage);
            socket.off("messages_read", handleSocketMessagesRead);
            socket.off("typing", handleSocketTyping);
            socket.off("message_deleted", handleSocketMessageDeleted);
            socket.off("auth_error", onAuthError);
            socket.off("room_error");
            socket.off("connect_error");
        };
    }, [socket]);

    // 3. Active Conversation — open the thread. fetchHistory stashes the outgoing
    //    conversation into the in-memory cache and restores the incoming one
    //    instantly on a cache hit (no reload when flipping between chats), or
    //    fetches it on a miss. It's idempotent, so re-runs are harmless.
    useEffect(() => {
        if (!socket || !activeConversation) return;
        useChatStore.getState().fetchHistory(activeConversation);
    }, [socket, activeConversation]);

    // 3b. On RE-connect (not the first connect), pull anything the open thread
    //     missed while the socket was down — the server doesn't replay those.
    useEffect(() => {
        if (connected && wasConnectedRef.current) {
            useChatStore.getState().refreshActiveHistory();
        }
        wasConnectedRef.current = connected;
    }, [connected]);

    // 4. Join ALL conversation rooms (for sidebar real-time updates: unread count, typing)
    //    Fires on connect/reconnect. Subscribes only to conversations array changes.
    useEffect(() => {
        if (!socket || !connected) return;

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

        // Re-join whenever the store changes (e.g. a new conversation appears).
        // joinAllRooms is idempotent — joinedRoomsRef skips rooms already joined.
        // (Plain subscribe: the selector form needs the subscribeWithSelector
        // middleware, which this store doesn't use.)
        const unsub = useConversationStore.subscribe(joinAllRooms);

        return () => unsub();
    }, [socket, connected]);

    return null;
}