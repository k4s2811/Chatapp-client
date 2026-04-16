import { useState } from 'react'


// ── Spinner ──────────────────────────────────────────────
export const Spinner = ({ size = 20, color = 'var(--color-accent)' }) => (
  <div
    className="animate-spin-custom shrink-0 rounded-full border-2 border-transparent"
    style={{ width: size, height: size, borderTopColor: color }}
  />
)


