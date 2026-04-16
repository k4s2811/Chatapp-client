import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Check, X, Loader2, Lock, Eye, EyeOff, ArrowLeft, Camera, LogOut, ShieldCheck, UserCircle, Pencil, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { ThemeToggle } from '../css/ThemeToggle'
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '../components/ui/field'
import { motion } from 'framer-motion'
import { ThemeSelector } from '../css/ThemeSelector';

const passwordRequirements = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
]


export default function Profile() {
  const { user, signout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showRequirements, setShowRequirements] = useState(false)


  const allRequirementsMet = passwordRequirements.every(req => req.test(form.newPassword))


  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setSuccess('Password changed. Signing out...')
      setTimeout(() => signout(), 2000)
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? errs.map(e => e.msg).join(' · ') : err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="w-[320px] md:w-[380px] flex flex-col border-r 
    border-sidebar-border shrink-0 bg-sidebar text-sidebar-foreground 
    h-screen overflow-y-auto" data-testid="sidebar">

      {/* Top Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-sidebar z-10">
        <div className="flex items-center gap-4">
          {/* <button onClick={() => navigate(-1)} className="hover:bg-sidebar-accent p-2 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button> */}
          <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Settings
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <ThemeSelector />
          <button className="p-2 hover:bg-sidebar-accent rounded-full transition-colors"><Pencil size={18} /></button>
          {/* <button className="p-2 hover:bg-sidebar-accent rounded-full transition-colors"><MoreVertical size={18} /></button> */}
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="relative group cursor-pointer">
          <Avatar className="h-28 w-28 border-2 border-primary/20 shadow-xl">
            <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
            <AvatarFallback className="text-3xl bg-primary/10">{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full border-4 border-sidebar shadow-lg">
            <Camera size={16} />
          </div>
        </div>
        <h2 className="mt-4 text-xl font-bold">.{user?.name || 'Kunal'}</h2>
        <p className="text-sm text-green-500 font-medium">online</p>
      </div>

      {/* Info Sections */}
      <div className="px-4 space-y-1">
        <button className="w-full flex items-center gap-4 p-3 hover:bg-sidebar-accent rounded-xl transition-all group">
          <UserCircle className="text-muted-foreground group-hover:text-primary transition-colors" size={24} />
          <div className="text-left">
            <p className="text-[15px] font-medium leading-none">{user?.email || 'xyz@gmail.com'}</p>
            <p className="text-xs text-muted-foreground mt-1">Email</p>
          </div>
        </button>

        <div className="h-[1px] bg-sidebar-border my-2 mx-2" />

        {/* Change Password Form Container */}
        <form onSubmit={handleChangePassword} className="space-y-3 p-2">
          <div className="flex items-center gap-2 px-2 mb-2 text-primary font-semibold text-sm">
            <ShieldCheck size={16} />
            <span>Update Security</span>
          </div>
          <FieldGroup>
            <Field>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="current-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Current Password"
                  value={form.currentPassword}
                  onChange={set('currentPassword')}
                  className="pl-10 pr-10"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                              text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>

            </Field>

            <Field>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                  onFocus={() => setShowRequirements(true)}
                  className="pl-10 pr-10"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                              text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>

              {showRequirements && (form.newPassword).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1.5"
                >
                  {passwordRequirements.map((req, index) => {
                    const met = req.test(form.newPassword)
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-2 text-xs ${met ? 'text-primary' : 'text-muted-foreground'
                          }`}
                      >
                        {met ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {req.label}
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

            </Field>

            <Field>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className="pl-10 pr-10"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                              text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

            </Field>
            <FieldError>{error}</FieldError>
          </FieldGroup>


          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button type="button" variant="ghost" className="h-10 text-sm">Account Info</Button>
            <Button type="submit" disabled={loading} className="h-10 text-sm bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Bottom Signout */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        <button
          onClick={() => signout()}
          className="w-full flex items-center justify-center gap-2 p-3 
          rounded-xl text-destructive hover:bg-destructive/10 
          transition-colors font-semibold"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}