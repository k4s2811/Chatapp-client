import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore';
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '../../components/ui/field'

const passwordRequirements = [
    { label: 'At least 6 characters', test: (p) => p.length >= 6 },
    { label: 'Contains a number', test: (p) => /\d/.test(p) },
    { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
]

export function SignupForm({ onSwitchToSignin }) {
    const signup = useAuthStore(state => state.signup);
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', name: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false)
    const [showRequirements, setShowRequirements] = useState(false)
    const [success, setSuccess] = useState('');

    const allRequirementsMet = passwordRequirements.every(req => req.test(form.password))

    const set = (k) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [k]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signup(form)
            setSuccess('Account created!')
            setTimeout(() => navigate('/chat'), 2500)
        } catch (err) {
            const errs = err.response?.data?.errors
            setError(
                errs
                    ? errs.map((e) => e.msg).join(' · ')
                    : err.response?.data?.message || 'Sign up failed'
            )
        } finally {
            setLoading(false)
        }
    };

    const handleGoogleLogin = () => {
        // Relative path → routed via the proxy (same as the other /user/* calls).
        window.location.href = '/user/google';
    };

    return (
        <form onSubmit={handleSubmit}>
            <FieldGroup>
                {/* Email */}
                <Field>
                    <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 
                        h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={form.email}
                            onChange={set('email')}
                            className="pl-10"
                            disabled={loading}
                            autoComplete="email"
                            required
                        />
                    </div>
                </Field>
                {/* Name */}
                <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={form.name}
                            onChange={set('name')}
                            className="pl-10"
                            disabled={loading}
                            autoComplete="name"
                            required
                        />
                    </div>
                </Field>
                {/* Password */}
                <Field>
                    <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            value={form.password}
                            onChange={set('password')}
                            onFocus={() => setShowRequirements(true)}
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

                    {/* Password Requirements */}
                    {showRequirements && (form.password).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1.5"
                        >
                            {passwordRequirements.map((req, index) => {
                                const met = req.test(form.password)
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

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <FieldError>{error}</FieldError>
                    </motion.div>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </Button>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
                    </div>
                </div>

                {/* Full-width Beautified Google Button */}
                <div className="w-full">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 transition-all duration-200 hover:bg-muted/50 hover:border-foreground/30 active:scale-[0.98] h-11"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="font-medium">Google</span>
                    </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToSignin}
                        className="font-medium text-primary hover:underline"
                    >
                        Sign in
                    </button>
                </p>
            </FieldGroup>
        </form>
    )
}