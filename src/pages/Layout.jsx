import React, { useEffect, useRef, useCallback } from "react";
import NavigationRail from "./NavigationRail";
import Sidebar from "./chat/Sidebar";
import ChatWindow from "./chat/ChatWindow";
import Profile from "./Profile";
import FindUsers from "./chat/FindUsers";
import SocketManager from "../components/SocketManager"; 

import { useModeStore } from "../store/useModeStore";
import { useConversationStore } from "../store/useConversationStore";

// PERF: Removed useChatStore subscriptions from Layout — ChatWindow reads stores directly

export default function Layout() {
    const mode = useModeStore((state) => state.mode);
    const setMode = useModeStore((state) => state.setMode);
    
    const activeConversation = useConversationStore((state) => state.activeConversation);
    const selectedUser = useConversationStore((state) => state.selectedUser);
    const startOrSelectConversation = useConversationStore((state) => state.startOrSelectConversation);
    const clearConversation = useConversationStore((state) => state.clearConversation);

    const prevMode = useRef(mode);
    // PERF: Use refs for swipe callbacks to avoid recreating handlers on every render
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const touchEndX = useRef(null);
    const touchEndY = useRef(null);
    const modeRef = useRef(mode);
    const activeConvRef = useRef(activeConversation);
    const setModeRef = useRef(setMode);
    useEffect(() => { modeRef.current = mode; });
    useEffect(() => { activeConvRef.current = activeConversation; });
    useEffect(() => { setModeRef.current = setMode; });

    const minSwipeDistance = 50;

    // PERF: Swipe handlers are stable (no deps) — read refs instead of closure values
    const onTouchStart = useCallback((e) => {
        touchEndX.current = null; 
        touchEndY.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    }, []);

    const onTouchMove = useCallback((e) => {
        touchEndX.current = e.targetTouches[0].clientX;
        touchEndY.current = e.targetTouches[0].clientY;
    }, []);

    const onTouchEnd = useCallback(() => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distanceX = touchStartX.current - touchEndX.current;
        const distanceY = touchStartY.current - touchEndY.current;
        
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;

        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            if (window.innerWidth < 768 && activeConvRef.current) return;

            const modes = ['chat', 'users', 'groups', 'profile'];
            const currentIndex = modes.indexOf(modeRef.current);

            if (isLeftSwipe && currentIndex < modes.length - 1) {
                setModeRef.current(modes[currentIndex + 1]);
            }
            if (isRightSwipe && currentIndex > 0) {
                setModeRef.current(modes[currentIndex - 1]);
            }
        }
    }, []);

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
        >
            <SocketManager />
            <NavigationRail />

            <div className="flex-1 flex overflow-hidden w-full relative">
                {/* PERF: Touch handlers moved to sidebar div only (not root) to avoid firing on every touch */}
                <div 
                    className={`w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-border h-full flex flex-col transition-transform ${isChatActive ? 'hidden md:flex' : 'flex'}`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {(mode === 'chat' || mode === 'groups') && <Sidebar />}
                    {mode === 'users' && <FindUsers selectedUserId={selectedUser?.id || selectedUser?._id} onSelectUser={startOrSelectConversation} />}
                    {mode === 'profile' && <Profile />}
                </div>

                <div className={`flex-1 h-full overflow-hidden ${isChatActive ? 'flex' : 'hidden md:flex'}`}>
                    <ChatWindow
                        conversation={activeConversation ? { id: activeConversation } : null}
                        user={selectedUser}
                        onBack={() => window.history.back()} 
                    />
                </div>
            </div>
        </div>
    );
}