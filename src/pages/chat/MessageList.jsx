import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { m, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import { formatDayDivider, isSameDay } from '../../lib/time';

// Consecutive messages from the same sender inside this window collapse into a
// single visual group (one timestamp + one status tick for the run).
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const sameSender = (a, b) => a && b && String(a.senderId) === String(b.senderId);

const withinGroupWindow = (a, b) => {
    const ta = new Date(a?.createdAt).getTime();
    const tb = new Date(b?.createdAt).getTime();
    if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
    return Math.abs(tb - ta) <= GROUP_WINDOW_MS;
};

/**
 * Precompute per-message layout flags in one pass so `itemContent` stays O(1)
 * and doesn't peek at neighbours on every render.
 *
 * A message starts a group when the previous message is from someone else, is
 * too old, or sits on a different calendar day (a date divider always breaks
 * the run). Deleted-message tombstones break groups on both sides so their
 * dashed styling doesn't merge into a neighbour's block.
 */
function computeLayout(messages) {
    return messages.map((msg, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];

        const dayChanged = !prev || !isSameDay(prev.createdAt, msg.createdAt);

        const isFirstInGroup = dayChanged
            || !sameSender(prev, msg)
            || !withinGroupWindow(prev, msg)
            || !!prev?.isDeleted
            || !!msg.isDeleted;

        const isLastInGroup = !next
            || !isSameDay(msg.createdAt, next.createdAt)
            || !sameSender(msg, next)
            || !withinGroupWindow(msg, next)
            || !!next?.isDeleted
            || !!msg.isDeleted;

        return {
            isFirstInGroup,
            isLastInGroup,
            // Only the first message of a day carries the divider above it.
            dayLabel: dayChanged ? formatDayDivider(msg.createdAt) : null,
        };
    });
}

const DateDivider = ({ label }) => (
    <div className="flex justify-center py-3">
        <span className="px-3 py-1 rounded-full bg-muted/80 backdrop-blur-sm text-[11px] font-medium uppercase tracking-wide text-muted-foreground shadow-sm">
            {label}
        </span>
    </div>
);

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
    retryMessage,
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

    // Grouping/divider flags, keyed by message id — `itemContent` receives an
    // absolute Virtuoso index (offset by firstItemIndex), not an array position,
    // so a lookup by id is the reliable way to pair a message with its flags.
    const layoutById = useMemo(() => {
        const layout = computeLayout(messages);
        const map = new Map();
        messages.forEach((m, i) => map.set(m._id || m.clientMessageId, layout[i]));
        return map;
    }, [messages]);

    // Depends on the values it renders, so read-receipt updates
    // (otherUserLastReadId) actually re-run it. MessageBubble is memoized, so
    // only bubbles whose status changed re-render.
    const itemContent = useCallback((_index, message) => {
        const isOwn = String(message.senderId) === String(currentUserId) || message.sending;

        let status = 'delivered';
        if (isOwn) {
            // `failed` wins over everything: the send was acked as failed (or
            // timed out), so the bubble must show retry rather than a clock.
            if (message.failed) status = 'failed';
            else if (!message._id) status = 'sending';
            else if (otherUserLastReadId && String(message._id) <= String(otherUserLastReadId)) status = 'read';
        }

        const { isFirstInGroup = true, isLastInGroup = true, dayLabel = null } =
            layoutById.get(message._id || message.clientMessageId) || {};

        return (
            <div className="px-4 sm:px-10 md:px-20 lg:px-32">
                <div className="max-w-5xl mx-auto">
                    {dayLabel && <DateDivider label={dayLabel} />}
                    <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        status={status}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup}
                        onDelete={message._id ? () => deleteMessage(message._id) : undefined}
                        onRetry={status === 'failed' && message.clientMessageId
                            ? () => retryMessage(message.clientMessageId)
                            : undefined}
                    />
                </div>
            </div>
        );
    }, [currentUserId, otherUserLastReadId, deleteMessage, retryMessage, layoutById]);

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
                    <m.div
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
                    </m.div>
                )}
            </AnimatePresence>
        </main>
    );
}

// Bubble-shaped placeholders that mirror the real thread's layout, so a cold
// open reads as "this chat is loading" instead of a generic spinner. Widths are
// static (not random) to keep the skeleton stable across re-renders.
const SKELETON_ROWS = [
    { own: false, w: 'w-40' }, { own: true, w: 'w-28' },
    { own: false, w: 'w-56' }, { own: false, w: 'w-32' },
    { own: true, w: 'w-48' }, { own: false, w: 'w-36' },
    { own: true, w: 'w-24' },
];

const MessageListSkeleton = () => (
    <main className="flex-1 flex flex-col justify-end overflow-hidden bg-background" aria-hidden="true">
        <div className="px-4 sm:px-10 md:px-20 lg:px-32 pb-4">
            <div className="max-w-5xl mx-auto">
                {SKELETON_ROWS.map((row, i) => (
                    <div key={i} className={`flex ${row.own ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div
                            className={`h-10 ${row.w} max-w-[75%] rounded-2xl ${row.own ? 'rounded-tr-sm' : 'rounded-tl-sm'} bg-muted animate-pulse`}
                            style={{ animationDelay: `${i * 80}ms` }}
                        />
                    </div>
                ))}
            </div>
        </div>
    </main>
);

const MessageList = ({ isLoadingMessages, activeConvId, ...rest }) => {
    // Show a placeholder while history is fetching so the list never mounts
    // empty — it mounts once (keyed by conversation) with the messages already
    // present, which lets initialTopMostItemIndex land it at the newest message.
    // On a cache hit isLoadingMessages is never true, so this never flashes.
    if (isLoadingMessages) return <MessageListSkeleton />;

    return <ConversationMessages key={activeConvId} {...rest} />;
};

export default memo(MessageList);
