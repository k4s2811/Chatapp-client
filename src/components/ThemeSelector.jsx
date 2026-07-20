import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import { Button } from "./ui/button";

const themeOptions = [
  { id: 'theme-1', name: 'Classic Indigo', color: 'oklch(0.55 0.18 280)' },
  { id: 'theme-2', name: 'Onyx Black', color: 'oklch(0.20 0 0)' },
  { id: 'theme-3', name: 'Emerald Wave', color: 'oklch(0.60 0.18 150)' },
  { id: 'theme-4', name: 'Ocean Blue', color: 'oklch(0.60 0.15 250)' },
  { id: 'theme-5', name: 'Glass', color: 'oklch(0.60 0.18 150)' },
  { id: 'theme-6', name: 'Sunset', color: 'oklch(0.62 0.22 15)' },
];

export const ThemeSelector = () => {
  const baseColor = useThemeStore(state => state.baseColor);
  const setBaseColor = useThemeStore(state => state.setBaseColor);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 rounded-full hover:bg-accent transition-colors border border-border bg-card/50"
      >
        <Palette size={16} className="text-primary" />
        <span className="text-xs font-semibold">Palette</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

            <m.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-2 w-52 rounded-2xl 
              bg-popover border border-border shadow-xl z-40 p-1.5 
              backdrop-blur-md"
            >
              <div className="px-2 py-2 mb-1 text-[10px] font-bold 
              text-muted-foreground uppercase tracking-widest 
              border-b border-border/50">
                Choose Palette
              </div>

              <div className="space-y-1 mt-1">
                {themeOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setBaseColor(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm
                      ${baseColor === t.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-5 w-5 rounded-full border border-border shadow-inner"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className={`font-medium ${baseColor === t.id ? 'font-bold' : ''}`}>
                        {t.name}
                      </span>
                    </div>
                    {baseColor === t.id && (
                      <m.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={16} strokeWidth={3} />
                      </m.div>
                    )}
                  </button>
                ))}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};