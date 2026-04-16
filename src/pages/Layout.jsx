import NavigationRail from "./NavigationRail";
import Sidebar from "./chat/Sidebar";
import ChatWindow from "./chat/ChatWindow";
import { useChatLogic } from '../hooks/useChatLogic';
import { useState } from "react";
import Profile from "./Profile";
import { useMode } from "./mode";

export default function Layout() {

    const {
        conversations,
        users,
        selectedConversationId,
        typingUsers,
        isLoading,
        getConversationUser,
        getConversationMessages,
        sendMessage,
        selectConversation
    } = useChatLogic();

    const handleSendMessage = (text) => {
        if (selectedConversationId) {
            sendMessage(selectedConversationId, text);
        }
    };

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);
    const selectedUser = selectedConversation ? getConversationUser(selectedConversation.id) : null;
    const messages = selectedConversation ? getConversationMessages(selectedConversation.id) : [];
    const isTyping = selectedConversationId ? typingUsers[selectedConversationId] : false;

    const { mode } = useMode();


    return (
        <div className="h-screen w-full flex overflow-hidden bg-background text-foreground" data-testid="app-container">
            <NavigationRail />

            {(mode === 'chat' || mode === 'users' || mode === 'groups') && (
                <>
                    <Sidebar
                        mode={mode} // Pass mode to Sidebar if it needs to switch views
                        conversations={conversations}
                        users={users}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={selectConversation}
                        isLoading={isLoading}
                    />
                </>
            )}

            {mode === 'profile' && <Profile />}

            <ChatWindow
                conversation={selectedConversation}
                user={selectedUser}
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
            />
        </div>
    )
}