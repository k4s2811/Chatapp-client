import { useEffect, useRef } from 'react';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import { useAuth } from '../../context/AuthContext'; 

export default function ChatWindow({
    conversation,
    user, 
    messages = [], 
    onSendMessage,
    isTyping,
    onTyping 
}) {
    const { user: currentUser } = useAuth(); 

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold tracking-tight text-foreground leading-none mb-1">
                                {userName}
                            </h3>
                            <div className="text-[11px] leading-none">
                                {isTyping ? (
                                    <span className="text-primary font-medium animate-pulse">typing...</span>
                                ) : (
                                    <span className="text-muted-foreground uppercase tracking-wider font-semibold opacity-70">
                                        Active
                                    </span>
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
                    style={{
                        backgroundImage: `var(--chat-pattern)`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '450px'
                    }}
                />

                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto px-4 sm:px-10 md:px-20 lg:px-32 py-8 scrollbar-thin scrollbar-thumb-border z-10 relative"
                >
                    <div className="flex flex-col space-y-3 max-w-5xl mx-auto w-full">
                        {messages.map((message) => {
                            const currentUserId = currentUser?.id || currentUser?._id;
                            const isMyMessage = message.senderId === currentUserId || message.sending;

                            return (
                                <MessageBubble
                                    key={message._id || message.clientMessageId}
                                    message={message}
                                    isOwn={isMyMessage} 
                                />
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
            </main>

            <footer className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border/50 z-20 pb-safe">
                <div className="max-w-5xl mx-auto w-full">
                    <MessageInput
                        key={conversation?.id || conversation?._id || 'default'}
                        onSend={onSendMessage}
                        onTyping={onTyping} // <-- Passed down to input
                    />
                </div>
            </footer>
        </div>
    );
};