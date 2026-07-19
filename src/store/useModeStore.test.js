import { describe, it, expect } from 'vitest';
import { useModeStore } from './useModeStore';

describe('useModeStore', () => {
  it('defaults to "chat"', () => {
    expect(useModeStore.getState().mode).toBe('chat');
  });

  it('setMode updates the mode', () => {
    useModeStore.getState().setMode('users');
    expect(useModeStore.getState().mode).toBe('users');
    useModeStore.getState().setMode('profile');
    expect(useModeStore.getState().mode).toBe('profile');
  });
});
