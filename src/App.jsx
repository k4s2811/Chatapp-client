import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary';

import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ChatProvider } from './context/ChatContext'
import { SocketProvider } from './context/SocketContext'
import MyFallbackComponent from './pages/errorPage'
import Layout from './pages/Layout.jsx';
import { ConversationProvider } from './context/ConversationContext'
import AuthPage from './pages/auth/authpage'
import { ModeProvider } from './pages/mode';


export default function App() {
  return (
    <ErrorBoundary FallbackComponent={MyFallbackComponent}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ModeProvider>
              <SocketProvider>
                <ConversationProvider>
                  <ChatProvider>
                    <Routes>
                      <Route path="/signin" element={<GuestRoute><AuthPage /></GuestRoute>} />
                      <Route path="/signup" element={<GuestRoute><AuthPage /></GuestRoute>} />

                      <Route path="/chat" element={
                        <ProtectedRoute>
                          <div className="h-[100dvh] w-full flex overflow-hidden bg-background text-foreground" data-testid="app-container">
                            <Layout />

                          </div>
                        </ProtectedRoute>
                      } />

                      <Route path="*" element={<Navigate to="/chat" replace />} />
                    </Routes>
                  </ChatProvider>
                </ConversationProvider>
              </SocketProvider>
            </ModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>

  )
}