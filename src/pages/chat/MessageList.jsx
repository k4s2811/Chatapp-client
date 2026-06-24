import { useCallback, useRef, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div> (false positive with flat config)
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';

// [Virtuoso] Replaced manual scroll container with react-virtuoso for virtualized rendering
// Only visible messages are rendered, drastically reducing DOM nodes and TBT
const MessageList = ({
    messages,
    currentUserId,
    otherUserLastReadId,
    deleteMessage,
    isFetchingMore,
    isTyping,
    hasMore,
    loadMoreMessages,
    showScrollButton,
    setShowScrollButton,
}) => {
    const virtuosoRef = useRef(null);

    // [Virtuoso] Renders only visible MessageBubble components; status computed per-item
    const itemContent = useCallback((index, message) => {
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
            <div className="px-4 sm:px-10 md:px-20 lg:px-32">
                <div className="max-w-5xl mx-auto">
                    <MessageBubble
                        message={message}
                        isOwn={isMyMessage}
                        status={messageStatus}
                        onDelete={() => message._id && deleteMessage(message._id)}
                    />
                </div>
            </div>
        );
    }, [currentUserId, otherUserLastReadId, deleteMessage]);

    // [Virtuoso] Header rendered above scrollable area when loading older messages
    const Header = useCallback(() => {
        if (!isFetchingMore) return null;
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
            </div>
        );
    }, [isFetchingMore]);

    // [Virtuoso] Footer rendered below the last message for typing indicator
    const Footer = useCallback(() => {
        if (!isTyping) return <div className="h-4" />;
        return (
            <div className="flex justify-start mb-4 px-4 sm:px-10 md:px-20 lg:px-32">
                <div className="max-w-5xl mx-auto w-full">
                    <TypingIndicator />
                </div>
            </div>
        );
    }, [isTyping]);

    // [Virtuoso] Scroll-to-bottom uses Virtuoso's scrollToIndex for precision
    const scrollToBottom = useCallback(() => {
        if (virtuosoRef.current && messages.length > 0) {
            virtuosoRef.current.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
        }
    }, [messages.length]);

    return (
        <main className="flex-1 flex flex-col relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
                style={{ backgroundImage: `var(--chat-pattern)`, backgroundRepeat: 'repeat', backgroundSize: '450px' }}
            />

            {/* [Virtuoso] Virtualized message list — only renders ~10-15 visible DOM nodes regardless of total messages */}
            <Virtuoso
                ref={virtuosoRef}
                className="z-10 relative"
                data={messages}
                itemContent={itemContent}
                startReached={() => {
                    if (hasMore && !isFetchingMore) {
                        loadMoreMessages();
                    }
                }}
                followOutput={'auto'}
                atBottomStateChange={(atBottom) => setShowScrollButton(!atBottom)}
                components={{ Header, Footer }}
                style={{ height: '100%' }}
            />

            <AnimatePresence>
                {showScrollButton && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.9 }}
                        className="absolute bottom-6 right-6 z-30"
                    >
                        <Button onClick={scrollToBottom} size="icon" className="h-10 w-10 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
                            <ChevronDown size={22} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default memo(MessageList);
