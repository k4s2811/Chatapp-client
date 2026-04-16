import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const EmptyState = () => {
  const { theme } = useTheme();

  // const backgroundImage = theme === 'dark'
  //   ? 'https://static.prod-images.emergentagent.com/jobs/8ab0440d-518a-42a7-b229-9ba378adf29e/images/c21359f82d9b9fcccaafabe69113ce05df839740d15564901801593bb98db36f.png'
  //   : 'https://static.prod-images.emergentagent.com/jobs/8ab0440d-518a-42a7-b229-9ba378adf29e/images/08763ae4896f8f1e0c601f162ccb98f65b86281ad8761c640b8ed65018002d3e.png';

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      // style={{ backgroundImage: `url(${backgroundImage})` }}
      data-testid="empty-chat-state"
    >
      {/* Overlay using your new custom CSS variables. 
        It uses the base background color with 80% opacity to let the image peek through.
      */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
        
        {/* The pulsing animation now wraps the icon container */}
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