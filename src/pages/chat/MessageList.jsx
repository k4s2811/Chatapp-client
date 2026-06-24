import { useCallback, useRef, useEffect, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div> (false positive with flat config)
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';

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

    // PERF: Use refs for itemContent deps so the callback stays stable (empty deps)
    const currentUserIdRef = useRef(currentUserId);
    const otherUserLastReadIdRef = useRef(otherUserLastReadId);
    const deleteMessageRef = useRef(deleteMessage);
    useEffect(() => { currentUserIdRef.current = currentUserId; });
    useEffect(() => { otherUserLastReadIdRef.current = otherUserLastReadId; });
    useEffect(() => { deleteMessageRef.current = deleteMessage; });

    const itemContent = useCallback((index, message) => {
        const isMyMessage = String(message.senderId) === currentUserIdRef.current || message.sending;

        let messageStatus = 'delivered';
        if (isMyMessage) {
            if (!message._id) {
                messageStatus = 'sending';
            } else if (otherUserLastReadIdRef.current && String(message._id) <= String(otherUserLastReadIdRef.current)) {
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
                        onDelete={message._id ? () => deleteMessageRef.current(message._id) : undefined}
                    />
                </div>
            </div>
        );
    }, []);

    // PERF: Refs for startReached deps to keep it stable
    const hasMoreRef = useRef(hasMore);
    const isFetchingMoreRef = useRef(isFetchingMore);
    const loadMoreRef = useRef(loadMoreMessages);
    useEffect(() => { hasMoreRef.current = hasMore; });
    useEffect(() => { isFetchingMoreRef.current = isFetchingMore; });
    useEffect(() => { loadMoreRef.current = loadMoreMessages; });

    const Header = useCallback(() => {
        if (!isFetchingMore) return null;
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
            </div>
        );
    }, [isFetchingMore]);

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

    // PERF: Use ref for messages.length so scrollToBottom stays stable
    const messagesLenRef = useRef(messages.length);
    useEffect(() => { messagesLenRef.current = messages.length; });
    const scrollToBottom = useCallback(() => {
        if (virtuosoRef.current && messagesLenRef.current > 0) {
            virtuosoRef.current.scrollToIndex({ index: messagesLenRef.current - 1, behavior: 'smooth' });
        }
    }, []);

    return (
        <main className="flex-1 flex flex-col relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
                style={{ backgroundImage: `var(--chat-pattern)`, backgroundRepeat: 'repeat', backgroundSize: '450px' }}
            />

            <Virtuoso
                ref={virtuosoRef}
                className="z-10 relative"
                data={messages}
                itemContent={itemContent}
                startReached={() => {
                    if (hasMoreRef.current && !isFetchingMoreRef.current) {
                        loadMoreRef.current();
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
