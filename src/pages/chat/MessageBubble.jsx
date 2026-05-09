import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Copy, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useConversation } from '../../context/ConversationContext';

const MessageBubble = ({ message, isOwn }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });

  // Access contexts to calculate read status locally
  const { user } = useAuth();
  const { conversations, activeConversation } = useConversation();

  const messageText = message?.content?.text || message?.text || "";
  const messageDate = message?.createdAt || message?.timestamp || new Date();

  // --- AUTOMATIC STATUS CALCULATION ---
  const status = useMemo(() => {
    if (!isOwn) return null; // We only care about statuses for messages WE sent
    if (message.sending) return "sending"; // Shows Clock
    if (!message._id) return "delivered";  // Fallback if DB ID hasn't arrived yet

    // Find the other user's lastReadMessageId
    const myId = String(user?.id || user?._id);
    const currentChat = conversations.find(c => String(c._id || c.id) === String(activeConversation));
    
    const otherParticipant = currentChat?.participants?.find(
      p => String(p.userId?._id || p.userId?.id || p.userId || p._id || p.id) !== myId
    );

    const otherUserLastReadId = otherParticipant?.lastReadMessageId;

    // Because MongoDB ObjectIDs are chronological, direct string comparison works perfectly
    if (otherUserLastReadId && String(message._id) <= String(otherUserLastReadId)) {
      return "read"; // Shows Double Blue Ticks
    }
    
    return "delivered"; // Shows Single Tick
  }, [isOwn, message, user, conversations, activeConversation]);


  const formatTime = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return ''; 
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
    setContextMenu({ show: true, x: e.pageX, y: e.pageY });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
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
        data-testid={`message-bubble-${message._id || message.clientMessageId}`}
      >
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative group`}>

          <div
            onContextMenu={handleContextMenu}
            className={`${isOwn
              ? 'bg-message-sent text-message-sent-foreground'
              : 'bg-message-received text-message-received-foreground border border-border'
              } rounded-2xl ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
              } shadow-sm px-4 py-2 max-w-[80%] md:max-w-[70%] break-words transition-transform`}
          >
            <p className="text-[16px] leading-relaxed whitespace-pre-wrap break-all md:break-words">
              {renderTextWithLinks(messageText)}
            </p>
          </div>

          <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-muted-foreground">
              {formatTime(messageDate)}
            </span>

            {/* Smart Icons Based on Computed Status */}
            {isOwn && (
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
      </motion.div>

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