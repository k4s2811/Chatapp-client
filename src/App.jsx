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
    restoreSession();
  }, [restoreSession]);

  if (loading) return null; // Or a loading spinner

  return (
    <ErrorBoundary FallbackComponent={MyFallbackComponent}>
      <BrowserRouter>
        {/* Look how clean and fast this is without Context Providers! */}
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