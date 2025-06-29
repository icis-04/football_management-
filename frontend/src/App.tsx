import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { getAccessToken } from './api/client';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { TeamsPage } from './pages/TeamsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { EmailManagement, UserManagement, TeamManagement, Analytics } from './pages/admin/AdminDashboard';

// Layout
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ProfileCompletionCheck } from './components/auth/ProfileCompletionCheck';

function App() {
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    // Try to refresh user on app load if token exists
    const token = getAccessToken();
    if (token) {
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProfileCompletionCheck>
                  <Layout />
                </ProfileCompletionCheck>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="teams" element={<TeamsPage />} />
            
            {/* Admin routes with proper nesting */}
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/emails" replace />} />
              <Route path="emails" element={<EmailManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="teams" element={<TeamManagement />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>
        </Routes>
        <ToastContainer />
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
