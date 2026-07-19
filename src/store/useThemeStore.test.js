import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('toggleDark flips isDark, persists, and applies the dark class', () => {
    const before = useThemeStore.getState().isDark;
    useThemeStore.getState().toggleDark();
    const after = useThemeStore.getState().isDark;

    expect(after).toBe(!before);
    expect(localStorage.getItem('isDark')).toBe(String(after));
    expect(document.documentElement.classList.contains('dark')).toBe(after);
  });

  it('setBaseColor updates state, persists, and swaps the theme class', () => {
    useThemeStore.getState().setBaseColor('theme-3');
    expect(useThemeStore.getState().baseColor).toBe('theme-3');
    expect(localStorage.getItem('baseColor')).toBe('theme-3');
    expect(document.documentElement.classList.contains('theme-3')).toBe(true);

    useThemeStore.getState().setBaseColor('theme-5');
    expect(document.documentElement.classList.contains('theme-3')).toBe(false);
    expect(document.documentElement.classList.contains('theme-5')).toBe(true);
  });
});
