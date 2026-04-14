import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { Input, Button, Alert } from '../components/UI'

const gridBg = {
  backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
  backgroundSize: '40px 40px',
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await authApi.forgotPassword(email)
      setMessage(data.message)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      <div className="fixed inset-0 z-0 opacity-40" style={gridBg} />
      <div className="animate-fade-up relative z-10 w-full max-w-md bg-[var(--color-bg2)] border border-[var(--color-border)] rounded p-10">
        <div className="mb-8">
          <div className="text-2xl font-extrabold tracking-tight mb-1.5">Reset Password</div>
          <div className="text-[12px] text-[var(--color-muted)] font-[var(--font-mono)]">
            Enter your email and we'll send a reset link
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Alert message={error} />
          <Alert type="success" message={message} />
          <Input label="Email" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" fullWidth loading={loading}>Send Reset Link</Button>
        </form>

        <div className="mt-6 text-center text-[12px] text-[var(--color-muted)] font-[var(--font-mono)]">
          <Link to="/signin" className="text-[var(--color-accent)] hover:underline">← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = searchParams.get('token')
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword })
      setSuccess('Password reset! Redirecting to sign in...')
      setTimeout(() => navigate('/signin'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="fixed inset-0 z-0 opacity-40" style={gridBg} />
        <div className="relative z-10 w-full max-w-md bg-[var(--color-bg2)] border border-[var(--color-border)] rounded p-10 text-center">
          <div className="text-[var(--color-red)] font-[var(--font-mono)] mb-4">Invalid or missing reset token.</div>
          <Link to="/forgot-password" className="text-[var(--color-accent)] text-[12px] font-[var(--font-mono)] hover:underline">
            Request a new link →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      <div className="fixed inset-0 z-0 opacity-40" style={gridBg} />
      <div className="animate-fade-up relative z-10 w-full max-w-md bg-[var(--color-bg2)] border border-[var(--color-border)] rounded p-10">
        <div className="mb-8">
          <div className="text-2xl font-extrabold tracking-tight mb-1.5">New Password</div>
          <div className="text-[12px] text-[var(--color-muted)] font-[var(--font-mono)]">Choose a strong new password</div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Alert message={error} />
          <Alert type="success" message={success} />
          <Input label="New Password" type="password" placeholder="••••••••"
            value={form.newPassword} onChange={set('newPassword')} required />
          <Input label="Confirm Password" type="password" placeholder="••••••••"
            value={form.confirmPassword} onChange={set('confirmPassword')} required />
          <Button type="submit" fullWidth loading={loading}>Reset Password</Button>
        </form>
      </div>
    </div>
  )
}