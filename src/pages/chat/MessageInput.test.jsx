import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
  it('sends trimmed text on Enter and clears the input', async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} onTyping={vi.fn()} />);
    const textarea = screen.getByLabelText('Message input');

    await userEvent.type(textarea, '  hello world  {Enter}');

    expect(onSend).toHaveBeenCalledWith('hello world');
    expect(textarea).toHaveValue('');
  });

  it('does not send on Shift+Enter (newline instead)', async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} onTyping={vi.fn()} />);
    const textarea = screen.getByLabelText('Message input');

    await userEvent.type(textarea, 'line{Shift>}{Enter}{/Shift}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send blank/whitespace-only text', async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} onTyping={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Message input'), '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('emits onTyping(true) when the user starts typing', async () => {
    const onTyping = vi.fn();
    render(<MessageInput onSend={vi.fn()} onTyping={onTyping} />);
    await userEvent.type(screen.getByLabelText('Message input'), 'x');
    expect(onTyping).toHaveBeenCalledWith(true);
  });

  it('caps input length at the backend limit', () => {
    render(<MessageInput onSend={vi.fn()} onTyping={vi.fn()} />);
    expect(screen.getByLabelText('Message input')).toHaveAttribute('maxlength', '4000');
  });

  it('disables input when disabled', () => {
    render(<MessageInput onSend={vi.fn()} onTyping={vi.fn()} disabled />);
    expect(screen.getByLabelText('Message input')).toBeDisabled();
  });
});
