import { create } from 'zustand';

export const useModeStore = create((set) => ({
  mode: 'chat',
  setMode: (mode) => set({ mode }),
}));