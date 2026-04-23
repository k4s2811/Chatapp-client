import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy } from 'lucide-react';

const ContextMenu = ({ show, x, y, onClose, onCopy }) => {
  useEffect(() => {
    if (!show) return;

    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleClick);
    };
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 min-w-[140px] bg-popover text-popover-foreground border border-border shadow-md rounded-md p-1"
          style={{ top: y, left: x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onCopy}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <Copy size={14} />
            Copy Message
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextMenu;