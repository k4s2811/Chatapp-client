import React, { useEffect, useRef } from "react";
import NavigationRail from "./NavigationRail";
import Sidebar from "./chat/Sidebar";
import ChatWindow from "./chat/ChatWindow";
import Profile from "./Profile";
import FindUsers from "./chat/FindUsers";
import { useMode } from "./mode";
import { useConversation } from "../context/ConversationContext";
import { useChat } from "../context/ChatContext"; 

export default function Layout() {
    const { mode } = useMode();
    const { 
        activeConversation, 
        selectedUser, 
        startOrSelectConversation,
        setActiveConversation 
    } = useConversation();
    
    const { messages, sendMessage, typingUsers, sendTyping } = useChat(); 

    // Keep track of the mode to detect when the user clicks a nav tab
    const prevMode = useRef(mode);

    const handleSendMessage = (text) => {
        if (!activeConversation) return;
        sendMessage({ conversationId: activeConversation, text });
    };

    const handleTyping = (isTypingState) => {
        if (!activeConversation) return;
        sendTyping(activeConversation, isTypingState);
    };

    const isTyping = selectedUser && typingUsers.some(id =>
        String(id) === String(selectedUser.id || selectedUser._id)
    );

    // Determines if we have an active chat to show the mobile overlay
    const isChatActive = !!activeConversation;

    useEffect(() => {
        if (mode !== prevMode.current) {
            if (window.innerWidth < 768 && activeConversation && typeof setActiveConversation === 'function') {
                setActiveConversation(null);
            }
            prevMode.current = mode;
        }
    }, [mode, activeConversation, setActiveConversation]);

    useEffect(() => {
        if (activeConversation) {
            window.history.pushState({ chatOpen: true }, '');
        }
    }, [activeConversation]);

    useEffect(() => {
        const handlePopState = (event) => {
            if (activeConversation) {
                if (typeof setActiveConversation === 'function') {
                    setActiveConversation(null); 
                } else {
                    console.error("Layout: The function to clear the conversation is missing or not named 'setActiveConversation'.");
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeConversation, setActiveConversation]);


    return (
        <div className="h-[100dvh] w-full flex flex-col-reverse md:flex-row overflow-hidden bg-background text-foreground" data-testid="app-container">
            <NavigationRail />

            <div className="flex-1 flex overflow-hidden w-full relative">
                {/* Side Panels - Full width on mobile, fixed width on desktop. Hidden on mobile if chat is active. */}
                <div className={`w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-border h-full flex flex-col transition-transform ${isChatActive ? 'hidden md:flex' : 'flex'}`}>
                    {(mode === 'chat' || mode === 'groups') && (
                        <Sidebar />
                    )}

                    {mode === 'users' && (
                        <FindUsers
                            selectedUserId={selectedUser?.id || selectedUser?._id}
                            onSelectUser={startOrSelectConversation}
                        />
                    )}

                    {mode === 'profile' && <Profile />}
                </div>

                {/* Chat Window - Full width on mobile. Hidden on mobile if NO chat is active. */}
                <div className={`flex-1 h-full overflow-hidden ${isChatActive ? 'flex' : 'hidden md:flex'}`}>
                    <ChatWindow
                        conversation={activeConversation ? { id: activeConversation } : null}
                        user={selectedUser}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isTyping={isTyping}
                        onTyping={handleTyping}
                        onBack={() => {
                            window.history.back();
                        }} 
                    />
                </div>
            </div>
        </div>
    );
}