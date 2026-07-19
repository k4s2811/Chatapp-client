import api from "../services/axios";

export const conversationApi = {
  // CREATE OR GET DM
  createOrGetConversation: (targetUserId) =>
    api.post("/conversations", { targetUserId }),

  // GET ALL CONVERSATIONS
  getConversations: () =>
    api.get("/conversations"),

  // MARK READ
  markConversationRead: (conversationId, messageId) =>
    api.patch(`/conversations/${conversationId}/read`, { messageId }),
};