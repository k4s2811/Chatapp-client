import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../api/conversationApi', () => ({
  conversationApi: {
    getConversations: vi.fn(),
    createOrGetConversation: vi.fn(),
    markConversationRead: vi.fn(() => Promise.resolve()),
  },
}));
vi.mock('../api/auth', () => ({
  usersApi: { getUsersByIds: vi.fn(() => Promise.resolve({ data: { data: [] } })) },
}));

import { conversationApi } from '../api/conversationApi';
import { useConversationStore } from './useConversationStore';
import { useAuthStore } from './useAuthStore';

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: { id: 'me' } });
  useConversationStore.setState({ conversations: [], activeConversation: null, selectedUser: null, isLoading: true });
});

describe('loadConversations', () => {
  it('hydrates denormalized participant snapshots and computes unread', async () => {
    conversationApi.getConversations.mockResolvedValue({
      data: {
        data: [{
          _id: 'c1',
          participants: [
            { userId: 'me' },
            { userId: 'u2', name: 'Bob', avatarUrl: 'http://cdn/b.png' },
          ],
          lastMessage: { messageId: 'm9', senderId: 'u2' },
        }],
      },
    });

    await useConversationStore.getState().loadConversations();

    const convs = useConversationStore.getState().conversations;
    expect(convs).toHaveLength(1);

    const other = convs[0].participants.find(p => p.userId?.id === 'u2');
    expect(other.userId).toMatchObject({ id: 'u2', name: 'Bob', avatar_url: 'http://cdn/b.png' });

    // Last message from the other user, unread by me → hasUnread true.
    expect(convs[0].hasUnread).toBe(true);
  });

  it('marks read when the last message was sent by me', async () => {
    conversationApi.getConversations.mockResolvedValue({
      data: { data: [{ _id: 'c1', participants: [{ userId: 'me' }, { userId: 'u2', name: 'Bob' }], lastMessage: { messageId: 'm9', senderId: 'me' } }] },
    });
    await useConversationStore.getState().loadConversations();
    expect(useConversationStore.getState().conversations[0].hasUnread).toBe(false);
  });
});

describe('handleSocketMessagesRead', () => {
  it('updates the reader participant lastReadMessageId', () => {
    useConversationStore.setState({
      conversations: [{ _id: 'c1', participants: [{ userId: { id: 'u2' } }, { userId: { id: 'me' } }] }],
    });
    useConversationStore.getState().handleSocketMessagesRead({ conversationId: 'c1', messageId: 'm5', readByUserId: 'u2' });

    const p = useConversationStore.getState().conversations[0].participants.find(p => p.userId.id === 'u2');
    expect(p.lastReadMessageId).toBe('m5');
  });
});

describe('handleSocketNewMessage (sidebar)', () => {
  it('bumps the conversation to the top and sets unread for an inactive chat', () => {
    useConversationStore.setState({
      activeConversation: 'other',
      conversations: [
        { _id: 'a', participants: [], lastMessage: null },
        { _id: 'c1', participants: [], lastMessage: null },
      ],
    });
    useConversationStore.getState().handleSocketNewMessage({
      _id: 'm1', conversationId: 'c1', senderId: 'u2', content: { text: 'yo' },
    });

    const convs = useConversationStore.getState().conversations;
    expect(String(convs[0]._id)).toBe('c1'); // moved to top
    expect(convs[0].hasUnread).toBe(true);
    expect(convs[0].lastMessage.content).toBe('yo');
  });
});
