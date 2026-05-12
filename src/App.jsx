import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import MyFallbackComponent from './pages/errorPage';
import Layout from './pages/Layout.jsx';
import AuthPage from './pages/auth/authpage';

export default function App() {
  const restoreSession = useAuthStore(state => state.restoreSession);
  const loading = useAuthStore(state => state.loading);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    restoreSession();
  }, [restoreSession]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="animate-spin shrink-0 rounded-full border-2 border-transparent border-t-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={MyFallbackComponent}>
      <BrowserRouter>
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}