import React, { useState } from 'react';
import { Group, MessageSquare, Users, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip';
import { useMode } from './mode';

const NavItem = ({ icon: Icon, label, mode, badge, active, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center h-12 w-12 rounded-2xl transition-all duration-200 group
          ${active
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
      >
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />

        {badge && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background">
            {badge}
          </span>
        )}

        {active && (
          <motion.div
            layoutId="active-pill"
            className="absolute -top-2 md:-left-3 md:top-auto w-8 h-1 md:w-1 md:h-8 bg-primary rounded-b-full md:rounded-l-none md:rounded-r-full"
          />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={10} className="hidden md:block">
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

const NavigationRail = () => {
  const navItems = [
    { icon: MessageSquare, label: 'Chats', mode: 'chat' },
    { icon: Users, label: 'Users', mode: 'users' },
    { icon: Group, label: 'Groups', mode: 'groups' }
  ];
  const { mode, setMode } = useMode();
  const [lastMode, setLastMode] = useState('chat');

  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-full h-16 md:w-16 md:h-[100dvh] flex flex-row md:flex-col items-center justify-between md:justify-start px-4 md:px-0 py-0 md:py-4 border-t md:border-t-0 md:border-r border-border bg-background shrink-0 z-50 pb-safe md:pb-4">
        
        <div className="flex flex-row md:flex-col gap-2 md:gap-4 flex-1 md:flex-none justify-around md:justify-start w-full md:w-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              {...item}
              active={mode === item.mode}
              onClick={() => setMode(item.mode)}
            />
          ))}

          <div className="hidden md:block h-[1px] w-8 bg-border mx-auto my-2" />
        </div>

        <div className="flex flex-row md:flex-col gap-4 mt-0 md:mt-auto ml-2 md:ml-0 items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (mode === 'profile') {
                    setMode(lastMode);
                  } else {
                    setLastMode(mode);
                    setMode('profile');
                  }
                }}
                className={`p-0.5 rounded-full border-2 transition-all 
                  hover:bg-muted hover:text-foreground shrink-0
                  ${mode === 'profile' ? 'border-primary' : 'border-transparent'}`}
              >
                <Settings size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="hidden md:block">
              <p>Profile Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

      </div>
    </TooltipProvider>
  );
};

export default NavigationRail;