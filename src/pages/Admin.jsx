import { useState, useEffect } from 'react'
import { usersApi } from '../api/auth'
import { Badge, Button, Card, Alert, Spinner, SectionTitle } from '../components/UI'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchUsers = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await usersApi.list({ page: p, limit: 10 })
      setUsers(data.data.users)
      setPagination(data.data.pagination)
    } catch { setError('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers(page) }, [page])

  const toggleActive = async (user) => {
    setError(''); setSuccess('')
    try {
      await usersApi.update(user.id, { is_active: !user.is_active })
      setSuccess(`User ${user.username} ${user.is_active ? 'deactivated' : 'activated'}`)
      fetchUsers(page)
    } catch { setError('Failed to update user') }
  }

  const deleteUser = async (user) => {
    if (!confirm(`Delete ${user.username}? This cannot be undone.`)) return
    setError(''); setSuccess('')
    try {
      await usersApi.delete(user.id)
      setSuccess(`User ${user.username} deleted`)
      fetchUsers(page)
    } catch { setError('Failed to delete user') }
  }

  const thClass = "px-4 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[var(--color-muted)] font-[var(--font-mono)] whitespace-nowrap"
  const tdClass = "px-4 py-3"

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1.5">User Management</h1>
        <p className="text-[var(--color-muted)] font-[var(--font-mono)] text-[12px]">Admin panel — manage all registered users</p>
      </div>

      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (
        <>
          <Card className="p-0 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Username','Email','Role','Status','Verified','Joined','Actions'].map(h => (
                    <th key={h} className={thClass}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}
                    className={`hover:bg-[var(--color-bg3)] transition-colors duration-150 ${i < users.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                    <td className={`${tdClass} text-[13px] font-semibold`}>{u.username}</td>
                    <td className={`${tdClass} text-[12px] font-[var(--font-mono)] text-[var(--color-dim)]`}>{u.email}</td>
                    <td className={tdClass}><Badge variant={u.role}>{u.role}</Badge></td>
                    <td className={tdClass}>
                      <Badge variant={u.is_active ? 'active' : 'inactive'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className={`${tdClass} text-[12px] font-[var(--font-mono)] ${u.is_verified ? 'text-[var(--color-green)]' : 'text-[var(--color-muted)]'}`}>
                      {u.is_verified ? '✓ Yes' : '○ No'}
                    </td>
                    <td className={`${tdClass} text-[11px] font-[var(--font-mono)] text-[var(--color-muted)] whitespace-nowrap`}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className={tdClass}>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteUser(u)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-[12px] text-[var(--color-muted)] font-[var(--font-mono)]">
                {pagination.total} total · Page {page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <Button size="sm" variant="ghost" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}