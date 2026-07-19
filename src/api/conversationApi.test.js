import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import api from '../services/axios';
import { conversationApi } from './conversationApi';

beforeEach(() => vi.clearAllMocks());

describe('conversationApi', () => {
  it('createOrGetConversation → POST /conversations', () => {
    conversationApi.createOrGetConversation('u2');
    expect(api.post).toHaveBeenCalledWith('/conversations', { targetUserId: 'u2' });
  });
  it('getConversations → GET /conversations', () => {
    conversationApi.getConversations();
    expect(api.get).toHaveBeenCalledWith('/conversations');
  });
  it('markConversationRead → PATCH /conversations/:id/read', () => {
    conversationApi.markConversationRead('c1', 'm7');
    expect(api.patch).toHaveBeenCalledWith('/conversations/c1/read', { messageId: 'm7' });
  });
});
