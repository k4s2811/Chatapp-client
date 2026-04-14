import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { ThemeProvider } from './context/ThemeContext.jsx'

import { useChatLogic } from './hooks/useChatLogic';
import Sidebar from './pages/chat/Sidebar';
import ChatWindow from './pages/chat/ChatWindow';

import AuthPage from './pages/auth/authpage'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Sessions from './pages/Sessions'
import Admin from './pages/Admin'
import { ForgotPassword, ResetPassword } from './pages/ForgotPassword'


export default function App() {
  const {
    conversations,
    users,
    selectedConversationId,
    typingUsers,
    isLoading,
    getConversationUser,
    getConversationMessages,
    sendMessage,
    selectConversation
  } = useChatLogic();

  const handleSendMessage = (text) => {
    if (selectedConversationId) {
      sendMessage(selectedConversationId, text);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const selectedUser = selectedConversation ? getConversationUser(selectedConversation.id) : null;
  const messages = selectedConversation ? getConversationMessages(selectedConversation.id) : [];
  const isTyping = selectedConversationId ? typingUsers[selectedConversationId] : false;

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

            {/* Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <div className="h-screen w-full flex overflow-hidden bg-neutral-50 dark:bg-[#0A0A0A]" data-testid="app-container">
                  <Sidebar
                    conversations={conversations}
                    users={users}
                    selectedConversationId={selectedConversationId}
                    onSelectConversation={selectConversation}
                    isLoading={isLoading}
                  />
                  <ChatWindow
                    conversation={selectedConversation}
                    user={selectedUser}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isTyping={isTyping}
                  />
                </div>
              </ProtectedRoute>
            } />


            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
