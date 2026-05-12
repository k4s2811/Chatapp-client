import { useEffect, useState, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';

// 1. Use the new Zustand stores instead of Context
import { useAuthStore } from '../../store/useAuthStore';
import { useSocketStore } from '../../store/useSocketStore';
import { useChatStore } from '../../store/useChatStore';

export default function ChatWindow({
    conversation,
    user,
    messages = [],
    onSendMessage,
    isTyping,
    onTyping,
    onBack // Prop for mobile navigation
}) {
    // 2. Select states directly from Zustand stores
    const currentUser = useAuthStore(state => state.user);
    const onlineUsers = useSocketStore(state => state.onlineUsers);
    const checkUserOnline = useSocketStore(state => state.checkUserOnline);
    const loadMoreMessages = useChatStore(state => state.loadMoreMessages);
    const hasMore = useChatStore(state => state.hasMore);
    const isFetchingMore = useChatStore(state => state.isFetchingMore);
    const deleteMessage = useChatStore(state => state.deleteMessage);

    const [showScrollButton, setShowScrollButton] = useState(false);

    const targetUserId = user?.id || user?._id ? String(user.id || user._id) : null;
    const isOnline = targetUserId ? onlineUsers.has(targetUserId) : false;

    useEffect(() => {
        if (targetUserId) {
            checkUserOnline(targetUserId);
        }
    }, [targetUserId, checkUserOnline]);

    const activeConvId = conversation?.id || conversation?._id;

    useEffect(() => {
        setShowScrollButton(false);
    }, [activeConvId]);

    const currentUserId = String(currentUser?.id || currentUser?._id);

    const otherUserLastReadId = useMemo(() => {
        if (!conversation?.participants) return null;

        const otherParticipant = conversation.participants.find(p => {
            const pId = String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id);
            return pId !== currentUserId;
        });

        return otherParticipant?.lastReadMessageId;
    }, [conversation?.participants, currentUserId]);

    const renderedMessages = useMemo(() => {
        return messages.map((message) => {
            const isMyMessage = String(message.senderId) === currentUserId || message.sending;

            let messageStatus = 'delivered';
            if (isMyMessage) {
                if (!message._id) {
                    messageStatus = 'sending';
                } else if (otherUserLastReadId && String(message._id) <= String(otherUserLastReadId)) {
                    messageStatus = 'read';
                }
            }

            return (
                <MessageBubble
                    key={message._id || message.clientMessageId}
                    message={message}
                    isOwn={isMyMessage}
                    status={messageStatus}
                    onDelete={() => message._id && deleteMessage(message._id)}
                />
            );
        });
    }, [messages, currentUserId, otherUserLastReadId, deleteMessage]);

    if (!conversation || !user) {
        return (
            <div className="flex-1 h-full bg-background flex items-center justify-center">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background transition-colors relative overflow-hidden" data-testid="chat-window">
            <ChatHeader user={user} isOnline={isOnline} isTyping={isTyping} onBack={onBack} />

            <MessageList 
                renderedMessages={renderedMessages}
                isFetchingMore={isFetchingMore}
                isTyping={isTyping}
                hasMore={hasMore}
                loadMoreMessages={loadMoreMessages}
                showScrollButton={showScrollButton}
                setShowScrollButton={setShowScrollButton}
                messagesCount={messages.length}
            />

            <footer className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border/50 z-20 pb-safe">
                <div className="max-w-5xl mx-auto w-full">
                    <MessageInput key={activeConvId || 'default'} onSend={onSendMessage} onTyping={onTyping} />
                </div>
            </footer>
        </div>
    );
}