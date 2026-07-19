import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from './MessageBubble';

const baseMsg = (over = {}) => ({
  _id: 'm1',
  senderId: 'me',
  createdAt: new Date().toISOString(),
  content: { text: 'hello world' },
  ...over,
});

describe('MessageBubble', () => {
  it('renders the message text', () => {
    render(<MessageBubble message={baseMsg()} isOwn status="delivered" />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders a tombstone for a deleted message', () => {
    render(<MessageBubble message={baseMsg({ isDeleted: true, content: { text: 'This message was deleted' } })} isOwn={false} />);
    expect(screen.getByText('This message was deleted')).toBeInTheDocument();
  });

  it('linkifies URLs in the text', () => {
    render(<MessageBubble message={baseMsg({ content: { text: 'see https://example.com now' } })} isOwn status="delivered" />);
    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('double-click opens a context menu with Copy (and Delete for own messages)', async () => {
    const onDelete = vi.fn();
    render(<MessageBubble message={baseMsg({ content: { text: 'copy me' } })} isOwn status="delivered" onDelete={onDelete} />);

    await userEvent.dblClick(screen.getByText('copy me'));

    // Label is "Copy" or "Copy selected text" depending on selection state.
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not open the menu for a deleted message', async () => {
    render(<MessageBubble message={baseMsg({ isDeleted: true, content: { text: 'This message was deleted' } })} isOwn status="delivered" />);
    await userEvent.dblClick(screen.getByText('This message was deleted'));
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });
});
