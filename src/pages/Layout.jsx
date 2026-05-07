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
    const { activeConversation, selectedUser, startOrSelectConversation } = useConversation();
    const { messages, sendMessage, typingUsers } = useChat();

    const handleSendMessage = (text) => {
        if (!activeConversation) return;
        sendMessage({ conversationId: activeConversation, text });
    };

    const isTyping = selectedUser && typingUsers.includes(selectedUser.id);

    return (
        <div className="h-screen w-full flex overflow-hidden bg-background text-foreground" data-testid="app-container">
            <NavigationRail />
            
            {/* Show recent chats */}
            {(mode === 'chat' || mode === 'groups') && (
                <Sidebar />
            )}

            {/* Show all global users */}
            {mode === 'users' && (
                <FindUsers
                    selectedUserId={selectedUser?.id}
                    onSelectUser={startOrSelectConversation}
                />
            )}

            {mode === 'profile' && <Profile />}

            {/* Main Chat Area */}
            <ChatWindow
                conversation={activeConversation ? { id: activeConversation } : null}
                user={selectedUser}
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
            />
        </div>
    );
}