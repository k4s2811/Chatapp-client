import api from "../services/axios";

export const conversationApi = {
  // CREATE OR GET DM
  createOrGetConversation: (targetUserId) =>
    api.post("/conversations", { targetUserId }),

  // GET ALL CONVERSATIONS
  getConversations: () => 
    api.get("/conversations"),

  // GET SINGLE CONVERSATION
  getConversation: (conversationId) =>
    api.get(`/conversations/${conversationId}`),

  // MARK READ
  markConversationRead: (conversationId, messageId) =>
    api.patch(`/conversations/${conversationId}/read`, { messageId }),
};