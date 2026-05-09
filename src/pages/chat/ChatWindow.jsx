import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { MoreVertical, Phone, Video, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';

export default function ChatWindow({
    conversation,
    user,
    messages = [],
    onSendMessage,
    isTyping,
    onTyping
}) {
    const { user: currentUser } = useAuth();

    const { socket, onlineUsers, checkUserOnline } = useSocket();
    const { loadMoreMessages, hasMore, isFetchingMore } = useChat();

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollState = useRef({ scrollHeight: 0, scrollTop: 0 });
    const lastMessageIdRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const targetUserId = String(user?.id || user?._id);
    const isOnline = onlineUsers.has(targetUserId); // Instantly evaluates to true/false

    useEffect(() => {
        if (targetUserId) {
            checkUserOnline(targetUserId);
        }
    }, [targetUserId, checkUserOnline]);


    const activeConvId = conversation?.id || conversation?._id;

    useEffect(() => {
        lastMessageIdRef.current = null;
        scrollState.current = { scrollHeight: 0, scrollTop: 0 };
        setShowScrollButton(false);
    }, [activeConvId]);


    const handleScroll = (e) => {
        const container = e.target;
        if (container.scrollTop < 50 && hasMore && !isFetchingMore) {
            scrollState.current = {
                scrollHeight: container.scrollHeight,
                scrollTop: container.scrollTop
            };
            loadMoreMessages();
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom > 250) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (container && scrollState.current.scrollHeight > 0 && !isFetchingMore) {
            const addedHeight = container.scrollHeight - scrollState.current.scrollHeight;
            container.scrollTop = scrollState.current.scrollTop + addedHeight;
            scrollState.current = { scrollHeight: 0, scrollTop: 0 };
        }
    }, [messages.length, isFetchingMore]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        const currentLastMessageId = lastMessage._id || lastMessage.clientMessageId;

        if (lastMessageIdRef.current === null) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
            lastMessageIdRef.current = currentLastMessageId;
            return;
        }

        if (lastMessageIdRef.current !== currentLastMessageId && scrollState.current.scrollHeight === 0) {
            const myId = String(currentUser?.id || currentUser?._id);
            const isMyMessage = String(lastMessage.senderId) === myId;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;

            if (isMyMessage || isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
            lastMessageIdRef.current = currentLastMessageId;
        }
    }, [messages, currentUser]);

    useEffect(() => {
        if (isTyping) {
            const container = messagesContainerRef.current;
            if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 200) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [isTyping]);

    if (!conversation || !user) {
        return (
            <div className="flex-1 h-full bg-background flex items-center justify-center">
                <EmptyState />
            </div>
        );
    }

    const userName = user?.name || user?.email?.split('@')[0] || 'Unknown User';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <div className="flex-1 flex flex-col h-full bg-background transition-colors relative overflow-hidden" data-testid="chat-window">

            <header className="backdrop-blur-xl bg-background/80 border-b border-border px-6 py-4 z-20 sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                <AvatarImage src={user?.avatar || undefined} alt={userName} />
                                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold tracking-tight text-foreground leading-none mb-1">
                                {userName}
                            </h3>
                            <div className="text-[12px] leading-none mt-0.5">
                                {isTyping ? (
                                    <span className="text-primary font-medium animate-pulse">typing...</span>
                                ) : isOnline ? (
                                    <span className="text-green-500 font-medium tracking-wide">Online</span>
                                ) : (
                                    <span className="text-muted-foreground font-medium opacity-70">Offline</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                            <Phone size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                            <Video size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                            <MoreVertical size={18} />
                        </Button>
                    </div>
                </div>
            </header>

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

                        {messages.map((message) => {
                            const currentUserId = currentUser?.id || currentUser?._id;
                            const isMyMessage = message.senderId === currentUserId || message.sending;

                            return (
                                <MessageBubble key={message._id || message.clientMessageId} message={message} isOwn={isMyMessage} />
                            );
                        })}

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

            <footer className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border/50 z-20 pb-safe">
                <div className="max-w-5xl mx-auto w-full">
                    <MessageInput key={activeConvId || 'default'} onSend={onSendMessage} onTyping={onTyping} />
                </div>
            </footer>
        </div>
    );
}