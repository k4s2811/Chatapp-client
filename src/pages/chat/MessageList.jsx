import { useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';

export default function MessageList({
    renderedMessages,
    isFetchingMore,
    isTyping,
    hasMore,
    loadMoreMessages,
    showScrollButton,
    setShowScrollButton,
    messagesCount
}) {
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const scrollState = useRef({ scrollHeight: 0, scrollTop: 0 });
    const scrollTimeoutRef = useRef(null);

    const handleScroll = useCallback((e) => {
        if (scrollTimeoutRef.current) return;

        scrollTimeoutRef.current = requestAnimationFrame(() => {
            const container = e.target;

            if (container.scrollTop < 50 && hasMore && !isFetchingMore) {
                scrollState.current = {
                    scrollHeight: container.scrollHeight,
                    scrollTop: container.scrollTop
                };
                loadMoreMessages();
            }

            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            setShowScrollButton(distanceFromBottom > 250);

            scrollTimeoutRef.current = null;
        });
    }, [hasMore, isFetchingMore, loadMoreMessages, setShowScrollButton]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Clean up animation frames on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                cancelAnimationFrame(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Keep scroll anchored when older historical messages load
    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (container && scrollState.current.scrollHeight > 0 && !isFetchingMore) {
            const addedHeight = container.scrollHeight - scrollState.current.scrollHeight;
            container.scrollTop = scrollState.current.scrollTop + addedHeight;
            scrollState.current = { scrollHeight: 0, scrollTop: 0 };
        }
    }, [messagesCount, isFetchingMore]);

    // Handle initial scrolling auto/smooth logic
    const lastMsgCountRef = useRef(messagesCount);
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || messagesCount === 0) return;

        const isNewIncoming = messagesCount > lastMsgCountRef.current;
        lastMsgCountRef.current = messagesCount;

        if (isNewIncoming) {
            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            // Smoothly scroll to bottom if user is close to the bottom
            if (distanceFromBottom < 350) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Initial mount scroll
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messagesCount]);

    // Snap to bottom when recipient starts typing
    useEffect(() => {
        if (isTyping) {
            const container = messagesContainerRef.current;
            if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 200) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [isTyping]);

    return (
        <main className="flex-1 flex flex-col relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
                style={{ backgroundImage: `var(--chat-pattern)`, backgroundRepeat: 'repeat', backgroundSize: '450px' }}
            />

            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 sm:px-10 md:px-20 lg:px-32 py-8 scrollbar-thin scrollbar-thumb-border z-10 relative"
                style={{ overflowAnchor: 'none' }}
            >
                <div className="flex flex-col space-y-3 max-w-5xl mx-auto w-full">
                    {isFetchingMore && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />
                        </div>
                    )}

                    {renderedMessages}

                    {isTyping && (
                        <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <TypingIndicator />
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

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
}