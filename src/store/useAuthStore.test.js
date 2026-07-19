import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../api/auth', () => ({
  authApi: {
    signin: vi.fn(),
    signup: vi.fn(),
    signout: vi.fn(() => Promise.resolve()),
    me: vi.fn(),
  },
  usersApi: { updateProfile: vi.fn() },
}));

import { authApi, usersApi } from '../api/auth';
import { useAuthStore } from './useAuthStore';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: null, loading: true });
});

describe('signin', () => {
  it('stores the access token and user', async () => {
    authApi.signin.mockResolvedValue({ data: { data: { accessToken: 'tok123', user: { id: 'me', name: 'Me' } } } });
    await useAuthStore.getState().signin({ email: 'a@b.co', password: 'x' });
    expect(localStorage.getItem('accessToken')).toBe('tok123');
    expect(useAuthStore.getState().user).toEqual({ id: 'me', name: 'Me' });
  });
});

describe('restoreSession', () => {
  it('sets loading false and skips /me when there is no token', async () => {
    localStorage.removeItem('accessToken');
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('hydrates the user from /me when a token exists', async () => {
    localStorage.setItem('accessToken', 'tok');
    authApi.me.mockResolvedValue({ data: { data: { user: { id: 'me', bio: 'hi' } } } });
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().user).toEqual({ id: 'me', bio: 'hi' });
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('clears the token if /me fails', async () => {
    localStorage.setItem('accessToken', 'bad');
    authApi.me.mockRejectedValue(new Error('401'));
    await useAuthStore.getState().restoreSession();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

describe('updateProfile', () => {
  it('merges the returned fields into the user', async () => {
    useAuthStore.setState({ user: { id: 'me', name: 'Old', bio: 'old' } });
    usersApi.updateProfile.mockResolvedValue({ data: { success: true, data: { id: 'me', name: 'Old', bio: 'new bio' } } });
    await useAuthStore.getState().updateProfile({ bio: 'new bio' });
    expect(useAuthStore.getState().user.bio).toBe('new bio');
  });
});
