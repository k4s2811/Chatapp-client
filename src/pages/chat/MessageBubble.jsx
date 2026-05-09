import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });

  // 1. SAFELY extract text (Handles both Backend format and Optimistic UI format)
  const messageText = message?.content?.text || message?.text || "";
  
  // 2. SAFELY extract the date (Handles createdAt, timestamp, or defaults to now)
  const messageDate = message?.createdAt || message?.timestamp || new Date();

  const formatTime = (date) => {
    if (!date) return '';
    try {
      // Ensure we are passing a valid Date object to date-fns
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return ''; // Fallback if the date is completely unparseable
    }
  };

  const renderTextWithLinks = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity break-all font-medium"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText); // Use unified text
      setIsCopied(true);
      setContextMenu({ show: false, x: 0, y: 0 }); 

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu({ show: false, x: 0, y: 0 });

    if (contextMenu.show) {
      document.addEventListener('click', closeMenu);
    }
    return () => {
      document.removeEventListener('click', closeMenu);
    };
  }, [contextMenu.show]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
        data-testid={`message-bubble-${message._id || message.clientMessageId}`}
      >
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative group`}>

          {/* Message Bubble */}
          <div
            onContextMenu={handleContextMenu}
            className={`${isOwn
              ? 'bg-message-sent text-message-sent-foreground'
              : 'bg-message-received text-message-received-foreground border border-border'
              } rounded-2xl ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
              } shadow-sm px-4 py-2 max-w-[80%] md:max-w-[70%] break-words transition-transform`}
          >
            {/* Render the unified text */}
            <p className="text-[16px] leading-relaxed whitespace-pre-wrap break-all md:break-words">
              {renderTextWithLinks(messageText)} 
            </p>
          </div>

          {/* Metadata */}
          <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-muted-foreground">
              {formatTime(messageDate)} {/* Use unified safe date */}
            </span>

            {isOwn && (
              <div className="text-muted-foreground">
                {message.readBy?.length > 1 ? ( 
                  <CheckCheck size={14} className="text-primary" />
                ) : !message.sending ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )}
              </div>
            )}

            <AnimatePresence>
              {isCopied && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md"
                >
                  <Copy size={12} />
                  <span>Copied!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>

      {/* Floating Context Menu */}
      <AnimatePresence>
        {contextMenu.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[140px] bg-popover text-popover-foreground border border-border shadow-md rounded-md p-1"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <Copy size={14} />
              Copy Message
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageBubble;