import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [baseColor, setBaseColor] = useState(() => localStorage.getItem('baseColor') || 'theme-1');

  const [isDark, setIsDark] = useState(() => localStorage.getItem('isDark') === 'true');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'dark');
    root.classList.add(baseColor);

    if (isDark) root.classList.add('dark');

    localStorage.setItem('baseColor', baseColor);
    localStorage.setItem('isDark', isDark);
  }, [baseColor, isDark]);

  const toggleDark = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ baseColor, setBaseColor, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};