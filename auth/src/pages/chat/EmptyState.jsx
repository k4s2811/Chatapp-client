import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

import { motion } from 'framer-motion'

const EmptyState = () => {
  // const { theme } = useTheme();

  // const backgroundImage = theme === 'dark'
  //   ? 'https://static.prod-images.emergentagent.com/jobs/8ab0440d-518a-42a7-b229-9ba378adf29e/images/c21359f82d9b9fcccaafabe69113ce05df839740d15564901801593bb98db36f.png'
  //   : 'https://static.prod-images.emergentagent.com/jobs/8ab0440d-518a-42a7-b229-9ba378adf29e/images/08763ae4896f8f1e0c601f162ccb98f65b86281ad8761c640b8ed65018002d3e.png';

  return (
    <div
      className="h-full flex flex-col items-center justify-center bg-cover bg-center relative"
      // style={{ backgroundImage: `url(${backgroundImage})` }}
      data-testid="empty-chat-state"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="rounded-full bg-primary/10 p-6"
      >
      </motion.div>

      <div className="absolute inset-0 bg-neutral-50/80 dark:bg-[#0A0A0A]/80 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="p-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <MessageCircle size={48} className="text-indigo-600 dark:text-indigo-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Select a conversation
        </h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400">
          Choose a contact to start messaging
        </p>
      </div>
    </div>
  );

};

export default EmptyState;

