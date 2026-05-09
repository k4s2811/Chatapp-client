import React from 'react';
import { useState } from 'react';
import { Group, MessageSquare, CircleDashed, Radio, Users, Settings, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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
            className="absolute -left-3 w-1 h-8 bg-primary rounded-r-full"
          />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={10}>
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
      <div className="w-16 flex flex-col items-center py-4 border-r
       border-border bg-background h-screen shrink-0">

        <div className="flex flex-col gap-4 flex-1">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              {...item}
              active={mode === item.mode}
              onClick={() => setMode(item.mode)}
            />
          ))}

          <div className="h-[1px] w-8 bg-border mx-auto my-2" />

        </div>

        <div className="flex flex-col gap-4 mt-auto">
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
                  hover:bg-muted hover:text-foreground 
                  ${mode === 'profile' ? 'border-primary' : 'border-transparent'}`}
              >
                <Settings size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <p>Profile Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

      </div>
    </TooltipProvider>
  );
};

export default NavigationRail;