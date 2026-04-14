import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      data-testid={`message-bubble-${message.id}`}
    >
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`${
            isOwn
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
              : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-50'
          } rounded-2xl ${
            isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
          } shadow-sm px-4 py-2 max-w-[80%] md:max-w-[70%] break-words`}
        >
          <p className="text-base leading-relaxed">{message.text}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatTime(message.timestamp)}
          </span>
          {isOwn && (
            <div className="text-neutral-500 dark:text-neutral-400">
              {message.read ? (
                <CheckCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
              ) : message.delivered ? (
                <CheckCheck size={14} />
              ) : (
                <Check size={14} />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
