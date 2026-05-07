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
    const { messages, sendMessage, typingUsers, sendTyping } = useChat(); 

    const handleSendMessage = (text) => {
        if (!activeConversation) return;
        sendMessage({ conversationId: activeConversation, text });
    };

    const handleTyping = (isTypingState) => {
        if (!activeConversation) return;
        sendTyping(activeConversation, isTypingState);
    };

    // Safe Check: Converts MongoDB ObjectIds and Strings to the same format before comparing
    const isTyping = selectedUser && typingUsers.some(id => 
        String(id) === String(selectedUser.id || selectedUser._id)
    );

    return (
        <div className="h-screen w-full flex overflow-hidden bg-background text-foreground" data-testid="app-container">
            <NavigationRail />
            
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

            {/* UNCOMMENTED PROPS: */}
            <ChatWindow
                conversation={activeConversation ? { id: activeConversation } : null}
                user={selectedUser}
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                onTyping={handleTyping}
            />
        </div>
    );
}