import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from '../services/axios';
import { authApi, usersApi } from './auth';

beforeEach(() => vi.clearAllMocks());

describe('authApi', () => {
  it('signup → POST /user/signup', () => {
    authApi.signup({ email: 'a@b.co' });
    expect(api.post).toHaveBeenCalledWith('/user/signup', { email: 'a@b.co' });
  });
  it('signin → POST /user/signin', () => {
    authApi.signin({ email: 'a@b.co', password: 'x' });
    expect(api.post).toHaveBeenCalledWith('/user/signin', { email: 'a@b.co', password: 'x' });
  });
  it('signout → POST /user/signout', () => {
    authApi.signout();
    expect(api.post).toHaveBeenCalledWith('/user/signout');
  });
  it('me → GET /user/me', () => {
    authApi.me();
    expect(api.get).toHaveBeenCalledWith('/user/me');
  });
  it('changePassword → POST /user/changepassword', () => {
    authApi.changePassword({ currentPassword: 'a', newPassword: 'b' });
    expect(api.post).toHaveBeenCalledWith('/user/changepassword', { currentPassword: 'a', newPassword: 'b' });
  });
});

describe('usersApi', () => {
  it('getAllUsers uses params and spreads config', () => {
    usersApi.getAllUsers(2, 'bob', { signal: 'sig' });
    expect(api.get).toHaveBeenCalledWith('/user/allusers', { params: { page: 2, limit: 10, search: 'bob' }, signal: 'sig' });
  });
  it('getUsersByIds joins an array of ids', () => {
    usersApi.getUsersByIds(['1', '2', '3']);
    expect(api.get).toHaveBeenCalledWith('/user/usersByIds', { params: { ids: '1,2,3' } });
  });
  it('getUsersByIds passes a string through', () => {
    usersApi.getUsersByIds('42');
    expect(api.get).toHaveBeenCalledWith('/user/usersByIds', { params: { ids: '42' } });
  });
  it('updateProfile → POST /user/update', () => {
    usersApi.updateProfile({ bio: 'hi' });
    expect(api.post).toHaveBeenCalledWith('/user/update', { bio: 'hi' });
  });
});
