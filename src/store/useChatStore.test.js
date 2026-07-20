import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../api/messageApi', () => ({
  messageApi: { getMessages: vi.fn(), deleteMessage: vi.fn(() => Promise.resolve()) },
}));

import { messageApi } from '../api/messageApi';
import { useChatStore } from './useChatStore';
import { useAuthStore } from './useAuthStore';
import { useSocketStore } from './useSocketStore';
import { useConversationStore } from './useConversationStore';

// The store routes incoming events by its OWN activeConvId (set by
// fetchHistory), so tests must open a conversation explicitly.
beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({
    messages: [], typingByConversation: {}, hasMore: true,
    isFetchingMore: false, isLoadingMessages: false,
    activeConvId: 'c1', cache: {}, cacheOrder: [],
  });
  useConversationStore.setState({ activeConversation: 'c1' });
  useAuthStore.setState({ user: { id: 'me' } });
  useSocketStore.setState({ socket: null });
});

// sendMessage/retryMessage go through socket.timeout(ms).emit(...), so the
// mock has to expose that chainable shape. Returns the emit spy plus a helper
// to invoke the ack callback the store registered.
function mockSocket() {
  const emit = vi.fn();
  const socket = { emit, timeout: () => ({ emit }) };
  useSocketStore.setState({ socket });
  return {
    emit,
    // Call the ack of the Nth emit: ack(err, response)
    ack: (err, response, call = 0) => emit.mock.calls[call][2](err, response),
  };
}

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
    const { emit } = mockSocket();
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

describe('send failure + retry', () => {
  it('marks the optimistic message failed when the ack times out', () => {
    const s = mockSocket();
    useChatStore.getState().sendMessage({ conversationId: 'c1', text: 'hello' });
    s.ack(new Error('timeout'), undefined);

    const msg = useChatStore.getState().messages[0];
    expect(msg.failed).toBe(true);
    expect(msg.sending).toBe(false);
  });

  it('marks it failed when the server acks without success', () => {
    const s = mockSocket();
    useChatStore.getState().sendMessage({ conversationId: 'c1', text: 'hello' });
    s.ack(null, { success: false });
    expect(useChatStore.getState().messages[0].failed).toBe(true);
  });

  it('clears failed and re-emits with the SAME clientMessageId on retry', () => {
    const s = mockSocket();
    useChatStore.getState().sendMessage({ conversationId: 'c1', text: 'hello' });
    s.ack(new Error('timeout'), undefined);

    const { clientMessageId } = useChatStore.getState().messages[0];
    useChatStore.getState().retryMessage(clientMessageId);

    // Reusing the id is what lets the server dedup if the original landed.
    expect(s.emit).toHaveBeenCalledTimes(2);
    expect(s.emit.mock.calls[1][1]).toMatchObject({ clientMessageId, text: 'hello' });
    expect(useChatStore.getState().messages[0]).toMatchObject({ sending: true, failed: false });

    s.ack(null, { success: true, messageId: 'm-server' }, 1);
    const settled = useChatStore.getState().messages[0];
    expect(settled).toMatchObject({ failed: false, sending: false, _id: 'm-server' });
    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});

describe('per-conversation cache', () => {
  it('restores a cached thread without refetching', async () => {
    const cached = [{ _id: 'm9', conversationId: 'c2', senderId: 'other' }];
    useChatStore.setState({ cache: { c2: { messages: cached, hasMore: false, firstItemIndex: 42 } }, cacheOrder: ['c2'] });

    await useChatStore.getState().fetchHistory('c2');

    const s = useChatStore.getState();
    expect(s.messages).toEqual(cached);
    expect(s.activeConvId).toBe('c2');
    expect(s.isLoadingMessages).toBe(false);
    expect(messageApi.getMessages).not.toHaveBeenCalled();
  });

  it('keeps a cached-but-not-open thread up to date with live messages', () => {
    useChatStore.setState({ cache: { c2: { messages: [], hasMore: false, firstItemIndex: 0 } }, cacheOrder: ['c2'] });
    useChatStore.getState().handleSocketNewMessage({ _id: 'm5', conversationId: 'c2', senderId: 'other' });

    expect(useChatStore.getState().cache.c2.messages).toHaveLength(1);
    expect(useChatStore.getState().messages).toHaveLength(0); // active thread untouched
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
