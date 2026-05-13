import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, ArrowLeft, Mail, Calendar, AlignLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

const ChatHeader = ({ user, isOnline, isTyping, onBack }) => {
    
    const [isHovered, setIsHovered] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const containerRef = useRef(null);

    const isVisible = isHovered || isLocked;

    const userName = user?.name || user?.email?.split('@')[0] || 'Unknown User';
    const userInitial = userName.charAt(0).toUpperCase();

    const joinDate = user?.created_at 
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unknown';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsLocked(false);
                setIsHovered(false); 
            }
        };

        if (isLocked) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLocked]);

    const handleToggle = () => {
        if (isLocked) {
            setIsLocked(false);
            setIsHovered(false); 
        } else {
            setIsLocked(true);
        }
    };

    return (
        <header className="relative w-full bg-background/95 backdrop-blur-xl border-b border-border px-4 md:px-6 py-3 md:py-4 shadow-sm z-40">
            <div className="flex items-center justify-between">

                <div 
                    className="flex items-center gap-2 md:gap-3 relative"
                    ref={containerRef}
                    onMouseEnter={() => !isLocked && setIsHovered(true)}
                    onMouseLeave={() => !isLocked && setIsHovered(false)}
                >
                    {/* Mobile Back Button (Excluded from hover logic to prevent weird behavior) */}
                    <button 
                        onClick={onBack} 
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                        aria-label="Back to conversations"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Clickable Avatar Container */}
                    <div className="relative cursor-pointer" onClick={handleToggle}>
                        <Avatar className="h-10 w-10 border border-border shadow-sm hover:ring-2 hover:ring-primary/50 transition-all">
                            <AvatarImage src={user?.avatar || undefined} alt={userName} />
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                        )}
                    </div>

                    {/* Clickable Name Container */}
                    <div className="flex flex-col cursor-pointer" onClick={handleToggle}>
                        <h3 className="font-bold tracking-tight text-foreground leading-none mb-1 hover:underline decoration-muted-foreground underline-offset-4">
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

                    {/* --- THE POPDOWN PROFILE CARD --- */}
                    <AnimatePresence>
                        {isVisible && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-[120%] left-0 md:left-10 w-72 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 cursor-default"
                            >
                                {/* Header / Banner */}
                                <div className="h-16 bg-gradient-to-r from-primary/20 to-secondary/20 relative"></div>
                                
                                <div className="px-5 pb-5 relative">
                                    {/* Large Avatar */}
                                    <Avatar className="h-16 w-16 border-4 border-card shadow-sm absolute -top-8 left-4 bg-card">
                                        <AvatarImage src={user?.avatar || undefined} alt={userName} className="object-cover" />
                                        <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                                            {userInitial}
                                        </AvatarFallback>
                                    </Avatar>
                                    
                                    {/* Name and Status tag */}
                                    <div className="pt-10 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-lg font-bold leading-tight truncate max-w-[200px]">{userName}</h2>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}`}></span>
                                                {isOnline ? 'Online now' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {/* Bio */}
                                        <div className="flex gap-3 text-sm">
                                            <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                            <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                                                {user?.bio || <span className="italic text-muted-foreground">No bio provided.</span>}
                                            </p>
                                        </div>

                                        {/* Email */}
                                        <div className="flex gap-3 text-sm items-center">
                                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <p className="text-foreground/90 truncate">
                                                {user?.email || 'Unknown email'}
                                            </p>
                                        </div>

                                        {/* Joined Date */}
                                        <div className="flex gap-3 text-sm items-center">
                                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <p className="text-muted-foreground text-xs">
                                                Joined {joinDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Right Side: Actions */}
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