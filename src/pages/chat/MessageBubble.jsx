import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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
  // selectedText: text highlighted inside this bubble when the menu opened.
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, selectedText: '' });
  const bubbleRef = useRef(null);

  const messageText = message?.content?.text || message?.text || "";
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
    const d = message.createdAt || new Date();
    if (!d) return '';
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  // Read any text currently selected inside THIS bubble.
  const getSelectionInBubble = () => {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim() || sel.rangeCount === 0) return '';
    const range = sel.getRangeAt(0);
    if (bubbleRef.current && bubbleRef.current.contains(range.commonAncestorContainer)) {
      return sel.toString();
    }
    return '';
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (isDeleted) return;
    // Capture the selection now — clicking a menu item later clears it.
    const selectedText = getSelectionInBubble();
    const menuWidth = selectedText ? 170 : 110;
    const menuHeight = 80;
    const posX = e.pageX - menuWidth;
    const safeX = posX < 20 ? 20 : posX;
    const posY = e.pageY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.pageY;
    setContextMenu({ show: true, x: safeX, y: posY, selectedText });
  };

  const handleCopy = async () => {
    try {
      // Copy just the highlighted text if there is a selection; otherwise the
      // whole message.
      await navigator.clipboard.writeText(contextMenu.selectedText || messageText);
      setIsCopied(true);
      setContextMenu({ show: false, x: 0, y: 0, selectedText: '' });
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setContextMenu({ show: false, x: 0, y: 0, selectedText: '' });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu({ show: false, x: 0, y: 0, selectedText: '' });
    if (contextMenu.show) document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [contextMenu.show]);

  return (
    <>
      {/* PERF: Removed framer-motion entry animation — caused layout/animation overhead on every visible message */}
      <div
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
        data-testid={`message-bubble-${message._id}`}
      >
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] min-w-0 relative group`}>
          <div
            ref={bubbleRef}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleContextMenu}
            className={`${isOwn
                ? 'bg-message-sent text-message-sent-foreground'
                : 'bg-message-received text-message-received-foreground border border-border'
              } rounded-2xl ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
              } shadow-sm px-4 py-2 max-w-full break-words transition-transform ${isDeleted ? 'opacity-70 bg-muted text-muted-foreground border-dashed' : ''
              }`}
          >
            {isDeleted ? (
              <div className="flex items-center gap-2 italic text-[15px]">
                <Ban size={14} className="opacity-60" />
                <span>This message was deleted</span>
              </div>
            ) : (
              <p className="text-[16px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] cursor-pointer">
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
                {status === 'read' ? (
                  <CheckCheck size={14} className="text-primary" />
                ) : status === 'delivered' ? (
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
      </div>

      <AnimatePresence>
        {contextMenu.show && !isDeleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[120px] bg-popover text-popover-foreground border border-border shadow-md rounded-md p-1"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left whitespace-nowrap"
            >
              <Copy size={16} />
              {contextMenu.selectedText ? 'Copy selected text' : 'Copy'}
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