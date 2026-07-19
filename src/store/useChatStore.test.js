import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../api/messageApi', () => ({
  messageApi: { getMessages: vi.fn(), deleteMessage: vi.fn(() => Promise.resolve()) },
}));

import { useChatStore } from './useChatStore';
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';
import { useConversationStore } from './useConversationStore';

beforeEach(() => {
  useChatStore.setState({ messages: [], typingByConversation: {}, hasMore: true, isFetchingMore: false, isLoadingMessages: false });
  useConversationStore.setState({ activeConversation: 'c1' });
  useAuthStore.setState({ user: { id: 'me' } });
  useSocketStore.setState({ socket: null });
});

describe('handleSocketTyping (centralized typing)', () => {
  it('records and clears typing per conversation', () => {
    const t = useChatStore.getState().handleSocketTyping;
    t({ userId: 'u1', conversationId: 'c1', isTyping: true });
    expect(useChatStore.getState().typingByConversation['c1']).toEqual(['u1']);

    t({ userId: 'u2', conversationId: 'c1', isTyping: true });
    expect(useChatStore.getState().typingByConversation['c1']).toEqual(['u1', 'u2']);

    t({ userId: 'u1', conversationId: 'c1', isTyping: false });
    expect(useChatStore.getState().typingByConversation['c1']).toEqual(['u2']);

    t({ userId: 'u2', conversationId: 'c1', isTyping: false });
  });

  it('keeps typing scoped to its own conversation', () => {
    const t = useChatStore.getState().handleSocketTyping;
    t({ userId: 'u1', conversationId: 'cX', isTyping: true });
    expect(useChatStore.getState().typingByConversation['cX']).toEqual(['u1']);
    expect(useChatStore.getState().typingByConversation['c1']).toBeUndefined();
    t({ userId: 'u1', conversationId: 'cX', isTyping: false });
  });
});

describe('handleSocketNewMessage', () => {
  it('appends a message for the active conversation and dedups by clientMessageId/_id', () => {
    const msg = { _id: 'm1', clientMessageId: 'k1', conversationId: 'c1', senderId: 'other', content: { text: 'hi' } };
    useChatStore.getState().handleSocketNewMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
    useChatStore.getState().handleSocketNewMessage(msg); // duplicate
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('ignores messages for a different conversation', () => {
    useChatStore.getState().handleSocketNewMessage({ _id: 'm2', conversationId: 'other', senderId: 'x' });
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});

describe('sendMessage (optimistic)', () => {
  it('adds an optimistic message and emits over the socket', () => {
    const emit = vi.fn();
    useSocketStore.setState({ socket: { emit } });
    useChatStore.getState().sendMessage({ conversationId: 'c1', text: 'hello' });

    const msgs = useChatStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ text: 'hello', senderId: 'me', sending: true });
    expect(msgs[0].clientMessageId).toBeTruthy();
    expect(emit).toHaveBeenCalledWith('send_message', expect.objectContaining({ text: 'hello' }), expect.any(Function));
  });

  it('does nothing without a socket', () => {
    useSocketStore.setState({ socket: null });
    useChatStore.getState().sendMessage({ conversationId: 'c1', text: 'x' });
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});

describe('handleSocketMessageDeleted', () => {
  it('marks a message as deleted with a tombstone', () => {
    useChatStore.setState({ messages: [{ _id: 'm1', conversationId: 'c1', content: { text: 'secret' } }] });
    useChatStore.getState().handleSocketMessageDeleted({ messageId: 'm1', conversationId: 'c1' });
    const m = useChatStore.getState().messages[0];
    expect(m.isDeleted).toBe(true);
    expect(m.content.text).toBe('This message was deleted');
  });
});
