import { useState } from 'react'

// ── Button ──────────────────────────────────────────────
export const Button = ({
  children, onClick, type = 'button', variant = 'primary',
  loading = false, disabled = false, fullWidth = false, size = 'md',
}) => {
  const base = `inline-flex items-center justify-center gap-2 font-bold tracking-widest uppercase rounded-sm border transition-all duration-150 cursor-pointer text-xs`
  const full = fullWidth ? 'w-full' : ''
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-6 py-3'
  const dis = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''

  const variants = {
    primary: 'bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
    ghost: 'bg-transparent text-[var(--color-text)] border-[var(--color-border-light)] hover:bg-[var(--color-bg3)]',
    danger: 'bg-red-500/10 text-[var(--color-red)] border-[var(--color-red)] hover:bg-red-500/20',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${full} ${sz} ${dis} ${variants[variant] || variants.primary}`}
    >
      {loading ? <Spinner size={14} color={variant === 'primary' ? 'var(--color-bg)' : 'var(--color-text)'} /> : children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────
export const Input = ({ label, error, type = 'text', ...props }) => {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold tracking-widest uppercase text-[var(--color-muted)] font-[var(--font-mono)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          className={`w-full px-3.5 py-2.5 ${isPassword ? 'pr-14' : ''} bg-[var(--color-bg2)] border rounded-sm text-[var(--color-text)] text-[13px] font-[var(--font-mono)] outline-none transition-colors duration-150
            ${error ? 'border-[var(--color-red)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-[var(--font-mono)] tracking-wider text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors bg-transparent border-none cursor-pointer"
          >
            {show ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
      {error && (
        <span className="text-[11px] text-[var(--color-red)] font-[var(--font-mono)]">{error}</span>
      )}
    </div>
  )
}

// ── Spinner ──────────────────────────────────────────────
export const Spinner = ({ size = 20, color = 'var(--color-accent)' }) => (
  <div
    className="animate-spin-custom shrink-0 rounded-full border-2 border-transparent"
    style={{ width: size, height: size, borderTopColor: color }}
  />
)

// ── Alert ──────────────────────────────────────────────
export const Alert = ({ type = 'error', message }) => {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div className={`px-3.5 py-2.5 rounded-sm text-[12px] font-[var(--font-mono)] border
      ${isError
        ? 'bg-red-500/10 border-[var(--color-red)] text-[var(--color-red)]'
        : 'bg-green-500/10 border-[var(--color-green)] text-[var(--color-green)]'
      }`}>
      {message}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-[var(--color-bg3)] text-[var(--color-dim)] border-[var(--color-border)]',
    admin: 'bg-yellow-400/10 text-[var(--color-accent)] border-[var(--color-accent)]',
    user: 'bg-[var(--color-bg3)] text-[var(--color-dim)] border-[var(--color-border-light)]',
    moderator: 'bg-blue-500/10 text-blue-400 border-blue-400',
    active: 'bg-green-500/10 text-[var(--color-green)] border-[var(--color-green)]',
    inactive: 'bg-red-500/10 text-[var(--color-red)] border-[var(--color-red)]',
  }
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-widest uppercase font-[var(--font-mono)] border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-[var(--color-bg2)] border border-[var(--color-border)] rounded p-6 ${className}`}>
    {children}
  </div>
)

// ── Divider ──────────────────────────────────────────────
export const Divider = ({ label }) => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-[var(--color-border)]" />
    {label && (
      <span className="text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-widest">
        {label}
      </span>
    )}
    <div className="flex-1 h-px bg-[var(--color-border)]" />
  </div>
)

// ── SectionTitle ──────────────────────────────────────────────
export const SectionTitle = ({ children }) => (
  <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-muted)] mb-5 font-[var(--font-mono)]">
    {children}
  </div>
)