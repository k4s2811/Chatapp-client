import { useState, useEffect } from "react";
import NavigationRail from "./NavigationRail";
import Sidebar from "./chat/Sidebar";
import ChatWindow from "./chat/ChatWindow";
import Profile from "./Profile";
import FindUsers from "./chat/FindUsers";

import { useMode } from "./mode";
import { useChat } from "../context/ChatContext"; 
import { conversationApi } from "../api/conversationApi"; 
import { messageApi } from "../api/messageApi"; 

export default function Layout() {
    const { mode, setMode } = useMode();
    const { 
        activeConversation, 
        setActiveConversation, 
        messages, 
        setMessages,
        sendMessage, 
        typingUsers 
    } = useChat();

    // Track the currently active user for the ChatWindow UI
    const [selectedUser, setSelectedUser] = useState(null);

    // Fetch conversation history whenever a new chat is selected
    useEffect(() => {
        if (!activeConversation) return;

        const fetchHistory = async () => {
            try {
                const res = await messageApi.getMessages(activeConversation);
                // Adjust based on your exact axios response structure
                setMessages(res.data?.data || res.data || []);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchHistory();
    }, [activeConversation, setMessages]);

    // Triggers when a user is clicked in the FindUsers sidebar
    const handleSelectUser = async (targetUser) => {
        // Map the user to match what ChatWindow expects (name, avatar, etc.)
        const formattedUser = {
            id: targetUser._id || targetUser.id,
            name: targetUser.name || targetUser.email.split('@')[0],
            avatar: targetUser.avatar_url || null,
        };
        
        setSelectedUser(formattedUser);
        console.log("Sending ID to backend:", formattedUser.id); 
        
        try {
            // 1. Tell backend to find or create a DM
            const res = await conversationApi.createOrGetConversation(formattedUser.id);
            const conversationData = res.data?.data || res.data;
            const convId = conversationData._id || conversationData.id;

            // 2. Set active ID in ChatContext (This makes socket join the room)
            setActiveConversation(convId);
            
            // Optional: Automatically switch back to the 'chat' mode sidebar once selected
            // setMode('chat'); 
        } catch (err) {
            console.error("Error creating or getting conversation:", err);
        }
    };

    const handleSendMessage = (text) => {
        if (!activeConversation) return;
        sendMessage({
            conversationId: activeConversation,
            text
        });
    };

    // Check if the user we are chatting with is typing
    const isTyping = selectedUser && typingUsers.includes(selectedUser.id);

    return (
        <div className="h-screen w-full flex overflow-hidden bg-background text-foreground" data-testid="app-container">
            <NavigationRail />
            <>
                {/* {(mode === 'chat' || mode === 'groups') && (
                    <Sidebar />
                )} 
                */}

                {mode === 'users' && (
                    <FindUsers
                        selectedUserId={selectedUser?.id}
                        onSelectUser={handleSelectUser}
                    />
                )}

                {mode === 'profile' && <Profile />}
            </>

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