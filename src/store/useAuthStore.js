import { create } from 'zustand';
import { authApi, usersApi } from '../api/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  
  // ADD THIS: Missing signup action
  signup: async (formValues) => {
    const res = await authApi.signup(formValues);
    // If your backend automatically logs the user in after signing up:
    if (res.data?.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      set({ user: res.data.data.user });
    }
    return res;
  },
  
  signin: async (credentials) => {
    const res = await authApi.signin(credentials);
    localStorage.setItem('accessToken', res.data.data.accessToken);
    set({ user: res.data.data.user });
    return res;
  },

  signout: async () => {
    try { await authApi.signout(); } catch {}
    localStorage.removeItem('accessToken');
    set({ user: null });
    if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
    }
  },

  restoreSession: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        set({ loading: false });
        return;
    }
    try {
        const res = await authApi.me();
        set({ user: res.data.data.user });
    } catch (err) {
        localStorage.removeItem('accessToken');
    } finally {
        set({ loading: false });
    }
  },
}));