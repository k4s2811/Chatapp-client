import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';

/**
 * The virtualized message list for ONE conversation.
 *
 * It is keyed by conversation id (see MessageList below) so each conversation
 * gets a fresh instance that mounts already scrolled to the newest message via
 * `initialTopMostItemIndex`. That removes all the manual "scroll to bottom on
 * first load / conversation switch" logic.
 *
 *  - New message while at bottom (sent or received) → Virtuoso `followOutput`
 *    scrolls after measuring the item, so it lands exactly at the bottom.
 *  - Your OWN message while scrolled up → force-scrolled by the effect below.
 *  - Incoming message while scrolled up → left in place; the ↓ button appears.
 *  - Scrolling to the top → `startReached` loads older history; `firstItemIndex`
 *    keeps the scroll position anchored (no jump).
 */
function ConversationMessages({
    messages,
    currentUserId,
    otherUserLastReadId,
    deleteMessage,
    isFetchingMore,
    isTyping,
    hasMore,
    loadMoreMessages,
    firstItemIndex,
}) {
    const virtuosoRef = useRef(null);
    const [atBottom, setAtBottom] = useState(true);
    const atBottomRef = useRef(true);
    // Virtuoso fires startReached once while settling on mount — skip that one.
    const pagingArmedRef = useRef(false);
    const lastMsgIdRef = useRef(null);

    // Depends on the values it renders, so read-receipt updates
    // (otherUserLastReadId) actually re-run it. MessageBubble is memoized, so
    // only bubbles whose status changed re-render.
    const itemContent = useCallback((_index, message) => {
        const isOwn = String(message.senderId) === String(currentUserId) || message.sending;

        let status = 'delivered';
        if (isOwn) {
            if (!message._id) status = 'sending';
            else if (otherUserLastReadId && String(message._id) <= String(otherUserLastReadId)) status = 'read';
        }

        return (
            <div className="px-4 sm:px-10 md:px-20 lg:px-32">
                <div className="max-w-5xl mx-auto">
                    <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        status={status}
                        onDelete={message._id ? () => deleteMessage(message._id) : undefined}
                    />
                </div>
            </div>
        );
    }, [currentUserId, otherUserLastReadId, deleteMessage]);

    const Header = useCallback(() => (
        <div className="flex justify-center py-4 min-h-[48px]">
            {isFetchingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground opacity-50" />}
        </div>
    ), [isFetchingMore]);

    const Footer = useCallback(() => (
        isTyping ? (
            <div className="mb-4 px-4 sm:px-10 md:px-20 lg:px-32">
                <div className="max-w-5xl mx-auto w-full"><TypingIndicator /></div>
            </div>
        ) : <div className="h-4" />
    ), [isTyping]);

    const scrollToBottom = useCallback((behavior = 'smooth') => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior });
    }, []);

    // Force-follow your OWN outgoing message even if you'd scrolled up. Every
    // other case (at-bottom follows, first render) is handled by Virtuoso.
    useEffect(() => {
        if (!messages.length) return;
        const last = messages[messages.length - 1];
        const id = last._id || last.clientMessageId;
        if (!id || id === lastMsgIdRef.current) return;

        const isFirst = lastMsgIdRef.current === null;
        lastMsgIdRef.current = id;

        const isOwn = String(last.senderId) === String(currentUserId) || last.sending;
        if (!isFirst && isOwn && !atBottomRef.current) scrollToBottom('smooth');
    }, [messages, currentUserId, scrollToBottom]);

    const handleStartReached = useCallback(() => {
        if (!pagingArmedRef.current) { pagingArmedRef.current = true; return; }
        if (hasMore && !isFetchingMore) loadMoreMessages();
    }, [hasMore, isFetchingMore, loadMoreMessages]);

    return (
        <main className="flex-1 flex flex-col relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
                style={{ backgroundImage: `var(--chat-pattern)`, backgroundRepeat: 'repeat', backgroundSize: '450px' }}
            />

            <Virtuoso
                ref={virtuosoRef}
                className="z-10 relative"
                style={{ height: '100%' }}
                data={messages}
                firstItemIndex={firstItemIndex}
                initialTopMostItemIndex={{ index: Math.max(messages.length - 1, 0), align: 'end' }}
                atBottomThreshold={120}
                increaseViewportBy={{ top: 400, bottom: 200 }}
                itemContent={itemContent}
                components={{ Header, Footer }}
                startReached={handleStartReached}
                followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
                atBottomStateChange={(b) => { atBottomRef.current = b; setAtBottom(b); }}
            />

            <AnimatePresence>
                {!atBottom && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.9 }}
                        className="absolute bottom-6 right-6 z-30"
                    >
                        <Button
                            onClick={() => scrollToBottom('smooth')}
                            size="icon"
                            aria-label="Scroll to latest"
                            className="h-10 w-10 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <ChevronDown size={22} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

const MessageList = ({ isLoadingMessages, activeConvId, ...rest }) => {
    // Show a loader while history is fetching so the list never mounts empty —
    // it mounts once (keyed by conversation) with the messages already present,
    // which lets initialTopMostItemIndex land it at the newest message.
    if (isLoadingMessages) {
        return (
            <main className="flex-1 flex items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-60" />
            </main>
        );
    }

    return <ConversationMessages key={activeConvId} {...rest} />;
};

export default memo(MessageList);
