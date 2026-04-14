import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { Button } from '../../components/ui/button';

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/70 dark:bg-black/60 border-t border-neutral-200 dark:border-neutral-800 p-4 z-10">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          data-testid="attach-file-button"
        >
          <Paperclip size={20} className="text-neutral-500 dark:text-neutral-400" />
        </Button>
        
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-full px-5 py-3 pr-12 bg-neutral-100 dark:bg-neutral-900 border-none focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
            style={{ maxHeight: '120px' }}
            data-testid="message-input"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
            data-testid="emoji-button"
          >
            <Smile size={18} className="text-neutral-500 dark:text-neutral-400" />
          </Button>
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="shrink-0 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="send-message-button"
        >
          <Send size={18} className="text-white" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;

