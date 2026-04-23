import api from './axios';


export const chatApi = {
  getConversations: () => api.get('/conversations'),
  getConversationById: (id) => api.get(`/conversations/${id}`),
  startConversation: (targetUserId) => api.post('/conversations', { targetUserId }),

  getMessages: (conversationId, limit = 30) => api.get(`/conversations/${conversationId}/messages?limit=${limit}`),
  sendMessage: (conversationId, text) => api.post(`/conversations/${conversationId}/messages`, { text }),

};