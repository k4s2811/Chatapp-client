import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './UI'

export const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <Spinner size={32} />
      </div>
    )
  }

  if (!user) return <Navigate to="/signin" replace />
  if (role && user.role !== role) return <Navigate to="/chat" replace />

  return children
}

export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <Spinner size={32} />
      </div>
    )
  }

  if (user) return <Navigate to="/chat" replace />
  return children
}