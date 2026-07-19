import api from "../services/axios";

export const messageApi = {
  // GET MESSAGES (messages are a sub-collection of a conversation)
  getMessages: (conversationId, params = {}) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),

  // DELETE MESSAGE (single-message op lives on the top-level resource)
  deleteMessage: (messageId) =>
    api.delete(`/messages/${messageId}`),
};
// Note: sending goes over the socket (send_message), not REST.
