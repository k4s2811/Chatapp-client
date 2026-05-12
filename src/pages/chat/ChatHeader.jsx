import React from 'react';
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

const ChatHeader = ({ user, isOnline, isTyping, onBack }) => {
    const userName = user?.name || user?.email?.split('@')[0] || 'Unknown User';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <header className="w-full bg-background/95 backdrop-blur-xl border-b border-border px-4 md:px-6 py-3 md:py-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Mobile Back Button */}
                    <button 
                        onClick={onBack} 
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                        aria-label="Back to conversations"
                    >
                        <ArrowLeft size={20} />
                    </button>

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

                <div className="flex items-center gap-0 md:gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                        <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hidden sm:inline-flex">
                        <Video size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                        <MoreVertical size={18} />
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default React.memo(ChatHeader);