import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Copy, Clock, Trash2, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ 
  message, 
  isOwn, 
  status,     
  onDelete    
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });

  const messageText = message?.content?.text || message?.text || "";
  const messageDate = message?.createdAt || new Date();
  const isDeleted = message?.isDeleted;

  const parsedContent = useMemo(() => {
    if (!messageText) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = messageText.split(urlRegex);

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
  }, [messageText]);

  const formattedTime = useMemo(() => {
    if (!messageDate) return '';
    try {
      return formatDistanceToNow(new Date(messageDate), { addSuffix: true });
    } catch {
      return '';
    }
  }, [messageDate]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (isDeleted) return;
    setContextMenu({ show: true, x: e.pageX, y: e.pageY });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setIsCopied(true);
      setContextMenu({ show: false, x: 0, y: 0 });

      setTimeout(() => {
        setIsCopied(false);
      }, 200);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setContextMenu({ show: false, x: 0, y: 0 });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu({ show: false, x: 0, y: 0 });
    if (contextMenu.show) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [contextMenu.show]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
        data-testid={`message-bubble-${message._id}`}
      >
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative group`}>
          <div
            onContextMenu={handleContextMenu}
            onDoubleClick={handleContextMenu}
            className={`${
              isOwn
                ? 'bg-message-sent text-message-sent-foreground'
                : 'bg-message-received text-message-received-foreground border border-border'
            } rounded-2xl ${
              isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
            } shadow-sm px-4 py-2 max-w-[80%] md:max-w-[70%] break-words transition-transform ${
              isDeleted ? 'opacity-70 bg-muted text-muted-foreground border-dashed' : ''
            }`}
          >
            {isDeleted ? (
              <div className="flex items-center gap-2 italic text-[15px]">
                <Ban size={14} className="opacity-60" />
                <span>This message was deleted</span>
              </div>
            ) : (
              <p className="text-[16px] leading-relaxed whitespace-pre-wrap break-all md:break-words cursor-pointer">
                {parsedContent}
              </p>
            )}
          </div>

          <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-muted-foreground">
              {formattedTime}
            </span>

            {isOwn && !isDeleted && (
              <div className="text-muted-foreground flex items-center">
                {status === 'delivered' ? (
                  <CheckCheck size={14} className="text-primary" />
                ) : status === 'read' ? (
                  <Check size={14} />
                ) : (
                  <Clock size={12} className="opacity-70" />
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

      <AnimatePresence>
        {contextMenu.show && !isDeleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[90px] bg-popover text-popover-foreground border border-border shadow-md rounded-md p-1"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <Copy size={16} />
              Copy
            </button>

            {isOwn && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-destructive hover:text-white text-red-500 transition-colors text-left mt-1"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const areEqual = (prevProps, nextProps) => {
  const prevText = prevProps.message?.content?.text || prevProps.message?.text;
  const nextText = nextProps.message?.content?.text || nextProps.message?.text;

  return (
    prevProps.message._id === nextProps.message._id &&
    prevProps.message.clientMessageId === nextProps.message.clientMessageId &&
    prevText === nextText &&
    prevProps.message.isDeleted === nextProps.message.isDeleted &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.status === nextProps.status
  );
};

export default memo(MessageBubble, areEqual);