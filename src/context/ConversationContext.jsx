import { createContext, useContext, useEffect, useState } from "react";

import { conversationApi } from "../api/conversationApi";

const ConversationContext = createContext(null);

export const ConversationProvider = ({ children }) => {

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [loading, setLoading] = useState(false);

    // LOAD CONVERSATIONS
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const res = await conversationApi.getConversations();
            setConversations(res.data.data);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // START CONVERSATION
    const startConversation = async (targetUserId) => {
        try {
            const res = await conversationApi.createOrGetConversation(targetUserId);
            const conversation = res.data.data;
            setActiveConversation(conversation);

            setConversations((prev) => {
                const exists = prev.some((c) => c._id === conversation._id);
                if (exists) {
                    return prev;
                }
                return [conversation, ...prev];
            });

            return conversation;

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <ConversationContext.Provider
            value={{
                conversations,
                setConversations,
                activeConversation,
                setActiveConversation,
                startConversation,
                loading
            }}
        >
            {children}
        </ConversationContext.Provider>
    );
};

export const useConversation = () => {

    const context = useContext(ConversationContext);

    if (!context) {
        throw new Error(
            "useConversation must be used inside provider"
        );
    }

    return context;
};