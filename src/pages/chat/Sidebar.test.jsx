import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useSocketStore } from '../../store/useSocketStore';
import { useChatStore } from '../../store/useChatStore';

const seed = (over = {}) => {
  useAuthStore.setState({ user: { id: 'me' } });
  useSocketStore.setState({ onlineUsers: new Set(['u2']) });
  useChatStore.setState({ typingByConversation: {} });
  useConversationStore.setState({
    isLoading: false,
    activeConversation: null,
    loadConversations: vi.fn(),
    startOrSelectConversation: vi.fn(),
    conversations: [{
      _id: 'c1',
      participants: [
        { userId: { id: 'me', name: 'Me' } },
        { userId: { id: 'u2', name: 'Bob', avatar_url: null } },
      ],
      lastMessage: { messageId: 'm1', content: 'hey there', senderId: 'u2', createdAt: new Date().toISOString() },
      hasUnread: true,
    }],
    ...over,
  });
};

beforeEach(() => seed());

describe('Sidebar', () => {
  it('renders the other participant name and last message', () => {
    render(<Sidebar />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('hey there')).toBeInTheDocument();
  });

  it('shows an online dot for online participants', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Online')).toBeInTheDocument();
  });

  it('prefixes the last message with "You:" when the current user sent it', () => {
    useConversationStore.setState((s) => ({
      conversations: [{ ...s.conversations[0], lastMessage: { ...s.conversations[0].lastMessage, senderId: 'me' } }],
    }));
    render(<Sidebar />);
    expect(screen.getByText('You: hey there')).toBeInTheDocument();
  });

  it('shows a typing indicator from centralized state', () => {
    useChatStore.setState({ typingByConversation: { c1: ['u2'] } });
    render(<Sidebar />);
    expect(screen.getByText(/typing/i)).toBeInTheDocument();
  });

  it('selecting a conversation calls startOrSelectConversation', async () => {
    const spy = vi.fn();
    useConversationStore.setState({ startOrSelectConversation: spy });
    render(<Sidebar />);
    await userEvent.click(screen.getByText('Bob'));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'u2' }));
  });

  it('filters conversations by search term', async () => {
    render(<Sidebar />);
    await userEvent.type(screen.getByPlaceholderText(/search conversations/i), 'zzz');
    await waitFor(() => expect(screen.queryByText('Bob')).not.toBeInTheDocument());
  });

  it('shows a skeleton while loading', () => {
    useConversationStore.setState({ isLoading: true });
    render(<Sidebar />);
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
});
