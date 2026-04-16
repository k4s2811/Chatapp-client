import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SigninForm } from './signin-form';
import { SignupForm } from './signup-form';
import { ThemeToggle_Lite } from '../../css/ThemeToggle.jsx';
import { MessageCircle } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      <ThemeToggle_Lite />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary"
          >
            <MessageCircle className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-foreground">ChatApp</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'signin'
                ? 'Welcome back! Sign in to continue.'
                : 'Create an account to get started.'}
            </p>
          </motion.div>
        </div>

        {/* Auth Form Card */}
        <motion.div
          layout
          className="overflow-hidden rounded-2xl border bg-card shadow-lg">

          {/* Tab Switcher */}
          <div className="relative flex border-b">
            <button
              onClick={() => setMode('signin')}
              className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${mode === 'signin'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Sign In
              {mode === 'signin' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-foreground"
                />
              )}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${mode === 'signup'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Sign Up
              {mode === 'signup' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-foreground"
                />
              )}
            </button>
          </div>
          <div className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SigninForm onSwitchToSignup={() => setMode('signup')} />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignupForm onSwitchToSignin={() => setMode('signin')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>

      </motion.div>
    </div>
  )
}