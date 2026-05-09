import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const EmptyState = () => {
  const { theme } = useTheme();

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      data-testid="empty-chat-state"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="p-6 rounded-full bg-primary/10 mb-2"
        >
          <MessageCircle size={48} className="text-primary" />
        </motion.div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          Select a conversation
        </h2>

        <p className="text-base text-muted-foreground max-w-md">
          Choose a contact to start messaging
        </p>

      </div>
    </div>
  );
};

export default EmptyState;