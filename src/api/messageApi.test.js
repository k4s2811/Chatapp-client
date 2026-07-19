import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import api from '../services/axios';
import { messageApi } from './messageApi';

beforeEach(() => vi.clearAllMocks());

describe('messageApi', () => {
  it('getMessages → GET /conversations/:id/messages with params', () => {
    messageApi.getMessages('c1', { limit: 20, before: 'm9' });
    expect(api.get).toHaveBeenCalledWith('/conversations/c1/messages', { params: { limit: 20, before: 'm9' } });
  });
  it('deleteMessage → DELETE /messages/:id (top-level resource)', () => {
    messageApi.deleteMessage('m1');
    expect(api.delete).toHaveBeenCalledWith('/messages/m1');
  });
});
