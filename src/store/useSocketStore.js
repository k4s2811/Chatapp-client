import { create } from 'zustand';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from './useAuthStore'; 

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  onlineUsers: new Set(),

  initSocket: () => {
    const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
    if (!userId) return;

    const socket = connectSocket();
    if (!socket) return;
    
    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false, onlineUsers: new Set() }));
    
    socket.on("user_online", ({ userId }) => {
        set((state) => {
            const next = new Set(state.onlineUsers);
            next.add(String(userId));
            return { onlineUsers: next };
        });
    });

    socket.on("user_offline", ({ userId }) => {
        set((state) => {
            const next = new Set(state.onlineUsers);
            next.delete(String(userId));
            return { onlineUsers: next };
        });
    });

    set({ socket });
  },

  disconnect: () => {
    disconnectSocket();
    set({ socket: null, connected: false, onlineUsers: new Set() });
  },

  // --- ADDED THE MISSING FUNCTION HERE ---
  checkUserOnline: (targetUserId) => {
    const socket = get().socket;
    if (!socket || !targetUserId) return;
    
    socket.emit("check_online", String(targetUserId), (response) => {
        set((state) => {
            const next = new Set(state.onlineUsers);
            if (response?.online) {
                next.add(String(targetUserId));
            } else {
                next.delete(String(targetUserId));
            }
            return { onlineUsers: next };
        });
    });
  }
}));