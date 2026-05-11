import React, { useState, useRef, useEffect, memo } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

const MessageInput = ({ onSend, disabled, onTyping }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  
  const typingTimeoutRef = useRef(null); 
  const isTypingRef = useRef(false); 

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    autoResize();

    if (onTyping && !disabled) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping(true); 
      }
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTyping(false);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      
      if (onTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        isTypingRef.current = false;
        onTyping(false);
      }

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus(); 
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-transparent px-4 py-3 z-10">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-5xl mx-auto">
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 rounded-full hover:bg-accent text-muted-foreground transition-all active:scale-95 hidden sm:flex" disabled={disabled}>
                <Paperclip size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={5}><p>Attach file</p></TooltipContent>
          </Tooltip>

          <div className={`flex-1 relative flex items-end bg-muted/50 backdrop-blur-md rounded-3xl border border-border/50 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-border'}`}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              rows={1}
              aria-label="Message input"
              className="w-full resize-none overflow-y-auto bg-transparent border-none outline-none py-2.5 pr-10 pl-4 text-base md:text-sm leading-tight text-foreground placeholder:text-muted-foreground/60 block min-h-[40px] scrollbar-thin"
              style={{ maxHeight: '120px' }}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors active:scale-90" disabled={disabled}>
                  <Smile size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={5}><p>Add emoji</p></TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" disabled={!message.trim() || disabled} className={`shrink-0 h-10 w-10 rounded-full transition-all active:scale-90 ${message.trim() ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                <Send size={16} className={`${message.trim() ? 'text-primary-foreground translate-x-0.5' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={5}><p>Send message</p></TooltipContent>
          </Tooltip>
        </form>
      </div>
    </TooltipProvider>
  );
};

export default memo(MessageInput);