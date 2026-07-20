import { useEffect, useMemo, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import ConnectionStatus from '../../components/ConnectionStatus';

// Stable empty reference so gating messages during a switch doesn't churn props.
const EMPTY_MESSAGES = [];

// 1. Use the new Zustand stores instead of Context
import { useAuthStore } from '../../store/useAuthStore';
import { useSocketStore } from '../../store/useSocketStore';
import { useChatStore } from '../../store/useChatStore';
import { useConversationStore } from '../../store/useConversationStore';

export default function ChatWindow({
    conversation,
    user,
    onBack
}) {
    // PERF: Read all chat state directly from stores instead of receiving from Layout
    const currentUser = useAuthStore(state => state.user);
    const onlineUsers = useSocketStore(state => state.onlineUsers);
    const checkUserOnline = useSocketStore(state => state.checkUserOnline);
    const messages = useChatStore(state => state.messages);
    const chatConvId = useChatStore(state => state.activeConvId);
    const sendMessage = useChatStore(state => state.sendMessage);
    const retryMessage = useChatStore(state => state.retryMessage);
    const sendTyping = useChatStore(state => state.sendTyping);
    const loadMoreMessages = useChatStore(state => state.loadMoreMessages);
    const hasMore = useChatStore(state => state.hasMore);
    const isFetchingMore = useChatStore(state => state.isFetchingMore);
    const deleteMessage = useChatStore(state => state.deleteMessage);
    const firstItemIndex = useChatStore(state => state.firstItemIndex);
    const isLoadingMessages = useChatStore(state => state.isLoadingMessages);

    const liveRegionRef = useRef(null);
    const prevAnnouncedIdRef = useRef(null);
    const announcedConvRef = useRef(null);

    const targetUserId = user?.id || user?._id ? String(user.id || user._id) : null;
    const isOnline = targetUserId ? onlineUsers.has(targetUserId) : false;

    useEffect(() => {
        if (targetUserId) {
            checkUserOnline(targetUserId);
        }
    }, [targetUserId, checkUserOnline]);

    const activeConvId = conversation?.id || conversation?._id;

    const currentUserId = String(currentUser?.id || currentUser?._id || '');

    // Selecting a conversation re-renders this component immediately, but the
    // store's messages only swap once SocketManager's effect runs fetchHistory
    // — one painted frame later. Without gating, that frame shows the PREVIOUS
    // conversation's messages under the new header. Render nothing until the
    // store agrees on which conversation is open.
    const isSwitching = String(chatConvId || '') !== String(activeConvId || '');
    const displayMessages = isSwitching ? EMPTY_MESSAGES : messages;

    // Derive typing from the centralized per-conversation map (only re-renders
    // when THIS conversation's typing list changes).
    const activeTyping = useChatStore(state => state.typingByConversation[String(activeConvId)]);
    const isTyping = !!(user && (activeTyping || []).some(id => String(id) === String(user.id || user._id)));

    const handleSendMessage = useCallback((text) => {
        if (!activeConvId) return;
        sendMessage({ conversationId: activeConvId, text });
    }, [activeConvId, sendMessage]);

    const handleTyping = useCallback((isTypingState) => {
        if (!activeConvId) return;
        sendTyping(activeConvId, isTypingState);
    }, [activeConvId, sendTyping]);

    // Announce new messages from the other user via aria-live.
    useEffect(() => {
        if (!messages.length || !user || !liveRegionRef.current) return;
        const lastMsg = messages[messages.length - 1];
        const msgId = lastMsg._id || lastMsg.clientMessageId;
        if (!msgId) return;

        // On conversation switch / first load, adopt the current last message as
        // already-seen so opening a chat doesn't announce its last message as new.
        if (announcedConvRef.current !== activeConvId) {
            announcedConvRef.current = activeConvId;
            prevAnnouncedIdRef.current = msgId;
            return;
        }

        if (msgId === prevAnnouncedIdRef.current) return;
        if (String(lastMsg.senderId) === currentUserId) return;

        prevAnnouncedIdRef.current = msgId;
        const userName = user.name || user.email?.split('@')[0] || 'Someone';
        const text = lastMsg.text || lastMsg.content?.text || 'a message';
        liveRegionRef.current.textContent = `New message from ${userName}: ${text}`;
    }, [messages, user, currentUserId, activeConvId]);

    const realConversation = useConversationStore(
        state => state.conversations.find(c => String(c._id || c.id) === String(activeConvId))
    );

    const otherUserLastReadId = useMemo(() => {
        const participants = realConversation?.participants || conversation?.participants;
        if (!participants) return null;

        const otherParticipant = participants.find(p => {
            const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
            return pId !== currentUserId;
        });

        return otherParticipant?.lastReadMessageId;
    }, [realConversation?.participants, conversation?.participants, currentUserId]);

    if (!conversation || !user) {
        return (
            <div className="flex-1 h-full bg-background flex items-center justify-center">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background transition-colors relative overflow-hidden" data-testid="chat-window">
            <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRegionRef} />
            <ChatHeader user={user} isOnline={isOnline} isTyping={isTyping} onBack={onBack} />
            <ConnectionStatus />

            <MessageList
                messages={displayMessages}
                currentUserId={currentUserId}
                otherUserLastReadId={otherUserLastReadId}
                deleteMessage={deleteMessage}
                retryMessage={retryMessage}
                isFetchingMore={isFetchingMore}
                isTyping={isTyping}
                hasMore={hasMore}
                loadMoreMessages={loadMoreMessages}
                firstItemIndex={firstItemIndex}
                isLoadingMessages={isLoadingMessages}
                activeConvId={activeConvId}
            />

            <footer className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border/50 z-20 pb-safe">
                <div className="max-w-5xl mx-auto w-full">
                    <MessageInput key={activeConvId || 'default'} onSend={handleSendMessage} onTyping={handleTyping} />
                </div>
            </footer>
        </div>
    );
}