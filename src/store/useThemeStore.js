import { create } from 'zustand';

const applyThemeToDOM = (baseColor, isDark) => {

  const root = document.documentElement;
  root.classList.remove('theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6', 'dark');
  root.classList.add(baseColor);
  if (isDark) {
    root.classList.add('dark');
  }
};
  
const initialBaseColor = localStorage.getItem('baseColor') || 'theme-1';
const initialIsDark = localStorage.getItem('isDark') === 'true';

// Apply the theme to the DOM immediately on load (prevents white flashes!)
if (typeof window !== 'undefined') {
  applyThemeToDOM(initialBaseColor, initialIsDark);
}

export const useThemeStore = create((set) => ({
  baseColor: initialBaseColor,
  isDark: initialIsDark,

  setBaseColor: (color) => set((state) => {
    localStorage.setItem('baseColor', color);
    applyThemeToDOM(color, state.isDark);
    return { baseColor: color };
  }),

  toggleDark: () => set((state) => {
    const nextDark = !state.isDark;
    localStorage.setItem('isDark', String(nextDark));
    applyThemeToDOM(state.baseColor, nextDark);
    return { isDark: nextDark };
  }),
}));