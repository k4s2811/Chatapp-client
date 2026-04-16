import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext.jsx'

import Layout from './pages/Layout.jsx';

import AuthPage from './pages/auth/authpage'
import Sessions from './pages/Sessions'
import Admin from './pages/Admin'
import { ForgotPassword, ResetPassword } from './pages/ForgotPassword'
import { ModeProvider } from './pages/mode';


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest only */}
            <Route path="/signin" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

            {/* Protected Dashboard/Profile */}
            {/* <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } /> */}

            {/* Main Chat Interface */}
            <Route path="/chat" element={
              <ProtectedRoute>
                {/* Updated: Swapped hardcoded hex colors for your bg-background variable */}
                <div className="h-screen w-full flex overflow-hidden bg-background text-foreground" data-testid="app-container">
                  <ModeProvider>
                    <Layout />
                  </ModeProvider>
                </div>
              </ProtectedRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}