import React, { useEffect, useRef } from "react";
import NavigationRail from "./NavigationRail";
import Sidebar from "./chat/Sidebar";
import ChatWindow from "./chat/ChatWindow";
import Profile from "./Profile";
import FindUsers from "./chat/FindUsers";
import SocketManager from "../components/SocketManager"; 

import { useModeStore } from "../store/useModeStore";
import { useConversationStore } from "../store/useConversationStore";
import { useChatStore } from "../store/useChatStore";

export default function Layout() {
    const mode = useModeStore((state) => state.mode);
    const setMode = useModeStore((state) => state.setMode); // Extracted setMode for swipe
    
    const activeConversation = useConversationStore((state) => state.activeConversation);
    const selectedUser = useConversationStore((state) => state.selectedUser);
    const startOrSelectConversation = useConversationStore((state) => state.startOrSelectConversation);
    const clearConversation = useConversationStore((state) => state.clearConversation);
    
    const messages = useChatStore((state) => state.messages);
    const sendMessage = useChatStore((state) => state.sendMessage);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const sendTyping = useChatStore((state) => state.sendTyping);

    const prevMode = useRef(mode);

    // --- SWIPE LOGIC ---
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const touchEndX = useRef(null);
    const touchEndY = useRef(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        touchEndX.current = null; 
        touchEndY.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    };

    const onTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
        touchEndY.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distanceX = touchStartX.current - touchEndX.current;
        const distanceY = touchStartY.current - touchEndY.current;
        
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;

        // Ensure the swipe is mostly horizontal to prevent accidental triggers while scrolling up/down
        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            // Do not switch modes if a chat is open on a mobile device
            if (window.innerWidth < 768 && activeConversation) return;

            const modes = ['chat', 'users', 'groups', 'profile'];
            const currentIndex = modes.indexOf(mode);

            if (isLeftSwipe && currentIndex < modes.length - 1) {
                setMode(modes[currentIndex + 1]);
            }
            if (isRightSwipe && currentIndex > 0) {
                setMode(modes[currentIndex - 1]);
            }
        }
    };
    // -------------------

    const handleSendMessage = (text) => {
        if (!activeConversation) return;
        sendMessage({ conversationId: activeConversation, text });
    };

    const handleTyping = (isTypingState) => {
        if (!activeConversation) return;
        sendTyping(activeConversation, isTypingState);
    };

    const isTyping = selectedUser && typingUsers.some(id => String(id) === String(selectedUser.id || selectedUser._id));
    const isChatActive = !!activeConversation;

    // Mobile override: clear chat when switching tabs
    useEffect(() => {
        if (mode !== prevMode.current) {
            if (window.innerWidth < 768 && activeConversation) clearConversation();
            prevMode.current = mode;
        }
    }, [mode, activeConversation, clearConversation]);

    // History API for mobile back button
    useEffect(() => {
        if (activeConversation) window.history.pushState({ chatOpen: true }, '');
    }, [activeConversation]);

    useEffect(() => {
        const handlePopState = () => { if (activeConversation) clearConversation(); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeConversation, clearConversation]);

    return (
        <div 
            className="h-[100dvh] w-full flex flex-col-reverse md:flex-row overflow-hidden bg-background text-foreground" 
            data-testid="app-container"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <SocketManager />
            <NavigationRail />

            <div className="flex-1 flex overflow-hidden w-full relative">
                <div className={`w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-border h-full flex flex-col transition-transform ${isChatActive ? 'hidden md:flex' : 'flex'}`}>
                    {(mode === 'chat' || mode === 'groups') && <Sidebar />}
                    {mode === 'users' && <FindUsers selectedUserId={selectedUser?.id || selectedUser?._id} onSelectUser={startOrSelectConversation} />}
                    {mode === 'profile' && <Profile />}
                </div>

                <div className={`flex-1 h-full overflow-hidden ${isChatActive ? 'flex' : 'hidden md:flex'}`}>
                    <ChatWindow
                        conversation={activeConversation ? { id: activeConversation } : null}
                        user={selectedUser}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isTyping={isTyping}
                        onTyping={handleTyping}
                        onBack={() => window.history.back()} 
                    />
                </div>
            </div>
        </div>
    );
}