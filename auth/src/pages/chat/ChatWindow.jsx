import React, { useEffect, useRef } from 'react';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';

const ChatWindow = ({
    conversation,
    user,
    messages,
    onSendMessage,
    isTyping
}) => {
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
            <div className="flex-1 h-full">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-neutral-50 dark:bg-[#0A0A0A]" data-testid="chat-window">
            {/* Header */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-black/60 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            {user.online && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-black rounded-full" data-testid="online-status-indicator" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold tracking-tight text-neutral-900 dark:text-neutral-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                {user.name}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {user.typing ? (
                                    <span className="text-indigo-600 dark:text-indigo-500" data-testid="typing-status">typing...</span>
                                ) : user.online ? (
                                    'online'
                                ) : (
                                    `last seen ${user.lastSeen}`
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            data-testid="voice-call-button"
                        >
                            <Phone size={18} className="text-neutral-600 dark:text-neutral-400" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            data-testid="video-call-button"
                        >
                            <Video size={18} className="text-neutral-600 dark:text-neutral-400" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            data-testid="more-options-button"
                        >
                            <MoreVertical size={18} className="text-neutral-600 dark:text-neutral-400" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-4"
                data-testid="messages-container"
            >
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === "me"}
                    />
                ))}
                {isTyping && (
                    <div className="flex justify-start mb-4" data-testid="typing-indicator">
                        <TypingIndicator />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput onSend={onSendMessage} />
        </div>
    );
};

export default ChatWindow;

