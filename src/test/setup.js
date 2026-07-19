import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- jsdom polyfills the app/components rely on ---

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() { return false; },
  });
}

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
window.IntersectionObserver = window.IntersectionObserver || MockObserver;
window.ResizeObserver = window.ResizeObserver || MockObserver;

window.scrollTo = window.scrollTo || (() => {});
Element.prototype.scrollTo = Element.prototype.scrollTo || function () {};
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};

// clipboard (MessageBubble copy)
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
}

// window.crypto.randomUUID (optimistic message ids)
if (!globalThis.crypto?.randomUUID) {
  globalThis.crypto = globalThis.crypto || {};
  globalThis.crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).slice(2);
}
