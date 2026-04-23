import { Button } from "../components/ui/button";
import { Pencil, User, Users } from 'lucide-react';
import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';

const type = [
    { id: 'new-chat', name: 'new chat', icon: User },
    { id: 'new-group', name: 'new group', icon: Users }
]


export function NewChat() {
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    return (
        <>  </>
        // <div className="relative">
        //     <Button
        //         variant="ghost"
        //         size="icon"
        //         onClick={() => setIsNewChatOpen(!isNewChatOpen)}
        //         className="h-9 w-9 rounded-full 
        //     bg-card shadow-sm border border-border"
        //         data-testid="new-chat-button"
        //     >
        //         <Pencil size={18} />
        //     </Button>
        //     <AnimatePresence >
        //         {isNewChatOpen && (
        //             <>
        //                 <div className="fixed inset-0 z-30"
        //                     onClick={() => setIsNewChatOpen(false)} />

        //                 <motion.div
        //                     initial={{ opacity: 0, y: 8, scale: 0.95 }}
        //                     animate={{ opacity: 1, y: 0, scale: 1 }}
        //                     exit={{ opacity: 0, y: 8, scale: 0.95 }}
        //                     className="absolute right-0 mt-2 w-52 rounded-2xl 
        //                     bg-popover border border-border shadow-xl z-40 p-1.5 
        //                     backdrop-blur-md"
        //                 >
        //                     <div className="px-2 py-2 mb-1 text-[10px] font-bold 
        //                     text-muted-foreground uppercase tracking-widest 
        //                     border-b border-border/50">
        //                         Choose Palette
        //                     </div>

        //                     <div className="space-y-1 mt-1">
        //                         {type.map((t) => (
        //                             <button
        //                                 key={t.id}
        //                                 onClick={() => {
        //                                     setIsNewChatOpen(false);
        //                                 }}
        //                             // className={`w-full flex items-center justify-between px-3 
        //                             //     py-2.5 rounded-xl transition-all text-sm bg-primary/10 
        //                             //     text-primary hover:bg-muted text-foreground`} 
        //                             >
        //                                 <div className="flex items-center gap-3">
        //                                     <div
        //                                         className="h-5 w-5 rounded-full border border-border shadow-inner"

        //                                     />
        //                                     <span className={`font-medium font-bold`}>
        //                                         {t.name}
        //                                     </span>
        //                                 </div>

        //                                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        //                                     <Check size={16} strokeWidth={3} />
        //                                 </motion.div>

        //                             </button>
        //                         ))}
        //                     </div>
        //                 </motion.div>
        //             </>
        //         )}
        //     </AnimatePresence >
        // </div>
    )
}