import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Badge } from './UI'

const NavItem = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[12px] font-semibold tracking-widest uppercase transition-all duration-150 border-l-2
      ${isActive
        ? 'text-[var(--color-accent)] bg-yellow-400/10 border-[var(--color-accent)]'
        : 'text-[var(--color-muted)] bg-transparent border-transparent hover:text-[var(--color-text)] hover:bg-[var(--color-bg3)]'
      }`
    }
  >
    <span className="text-base leading-none">{icon}</span>
    {label}
  </NavLink>
)

export const Layout = ({ children }) => {
  const { user, signout } = useAuth()
  const navigate = useNavigate()

  const handleSignout = async () => {
    await signout()
    navigate('/signin')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[var(--color-bg2)] border-r border-[var(--color-border)] flex flex-col px-4 py-6">
        {/* Logo */}
        <div className="mb-8 pl-3">
          <div className="text-lg font-extrabold tracking-tight text-[var(--color-accent)]">
            AUTH<span className="text-[var(--color-muted)]">CORE</span>
          </div>
          <div className="text-[10px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-widest mt-0.5">
            v1.0.0
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          <NavItem to="/dashboard" icon="⬡" label="Dashboard" />
          <NavItem to="/profile"   icon="◎" label="Profile" />
          <NavItem to="/sessions"  icon="◈" label="Sessions" />
          {user?.role === 'admin' && (
            <NavItem to="/admin" icon="◆" label="Admin" />
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2.5">
          <div className="pl-3">
            <div className="text-[12px] font-semibold text-[var(--color-text)] mb-1">{user?.name}</div>
            <div className="text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] truncate">{user?.email}</div>
            <div className="mt-1.5">
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
          </div>
          <button
            onClick={handleSignout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[12px] font-semibold tracking-widest uppercase text-[var(--color-muted)] bg-transparent border-none border-l-2 border-transparent hover:text-[var(--color-red)] hover:bg-red-500/10 transition-all duration-150 cursor-pointer text-left w-full"
          >
            <span className="text-base">→</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-10 bg-[var(--color-bg)]">
        {children}
      </main>
    </div>
  )
}