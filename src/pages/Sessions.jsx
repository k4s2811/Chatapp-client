import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersApi, authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Alert, Spinner } from '../components/UI'

export default function Sessions() {
  const { signout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    usersApi.getSessions()
      .then(({ data }) => setSessions(data.data.sessions))
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [])

  const handleRevokeAll = async () => {
    setRevoking(true)
    try {
      await authApi.signoutAll()
      signout()
      navigate('/signin')
    } catch {
      setError('Failed to revoke sessions')
      setRevoking(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1.5">Active Sessions</h1>
          <p className="text-[var(--color-muted)] font-[var(--font-mono)] text-[12px]">
            All devices where you're currently logged in
          </p>
        </div>
        <Button variant="danger" loading={revoking} onClick={handleRevokeAll}>Revoke All</Button>
      </div>

      {error && <Alert message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : sessions.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-[var(--color-muted)] font-[var(--font-mono)] text-[12px]">
            No active sessions found.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s, i) => (
            <Card key={s.id} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-2 h-2 rounded-full shrink-0
                    ${i === 0 ? 'bg-[var(--color-green)] animate-pulse-dot shadow-[0_0_6px_var(--color-green)]' : 'bg-[var(--color-muted)]'}`}
                  />
                  <span className={`text-[12px] font-semibold ${i === 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-muted)]'}`}>
                    {i === 0 ? 'Current Session' : `Session ${i + 1}`}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    ['IP Address', s.ip_address || 'Unknown'],
                    ['Created',    new Date(s.created_at).toLocaleString()],
                    ['Expires',    new Date(s.expires_at).toLocaleString()],
                    ['User Agent', s.user_agent || 'Unknown'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-3">
                      <span className="min-w-[100px] text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-wider uppercase shrink-0">
                        {label}
                      </span>
                      <span className="text-[11px] text-[var(--color-dim)] font-[var(--font-mono)] truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}