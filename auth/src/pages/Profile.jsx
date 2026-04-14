import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { Input, Button, Alert, Card, Divider, SectionTitle } from '../components/UI'

export default function Profile() {
  const { user, signout } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setSuccess('Password changed. You will be signed out.')
      setTimeout(() => signout(), 2000)
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? errs.map(e => e.msg).join(' · ') : err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1.5">Profile</h1>
        <p className="text-[var(--color-muted)] font-[var(--font-mono)] text-[12px]">Manage your account settings</p>
      </div>

      {/* Account Info */}
      <Card className="mb-6">
        <SectionTitle>Account Information</SectionTitle>
        <div className="grid grid-cols-2 gap-5">
          {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role], ['Verified', user?.is_verified ? 'Yes' : 'No']].map(([label, val]) => (
            <div key={label}>
              <div className="text-[11px] text-[var(--color-muted)] font-[var(--font-mono)] tracking-widest uppercase mb-1.5">{label}</div>
              <div className="text-[13px] font-[var(--font-mono)] text-[var(--color-text)] px-3 py-2.5 bg-[var(--color-bg3)] rounded-sm border border-[var(--color-border)]">
                {val}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <SectionTitle>Change Password</SectionTitle>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Alert message={error} />
          <Alert type="success" message={success} />
          <Input label="Current Password" type="password" placeholder="••••••••"
            value={form.currentPassword} onChange={set('currentPassword')} required />
          <Divider label="new password" />
          <Input label="New Password" type="password" placeholder="Min 8 chars, A-Z, a-z, 0-9"
            value={form.newPassword} onChange={set('newPassword')} required />
          <Input label="Confirm New Password" type="password" placeholder="••••••••"
            value={form.confirmPassword} onChange={set('confirmPassword')} required
            error={form.confirmPassword && form.newPassword !== form.confirmPassword ? 'Passwords do not match' : ''} />
          <div>
            <Button type="submit" loading={loading}>Update Password</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}