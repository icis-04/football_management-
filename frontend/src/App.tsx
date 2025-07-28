import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { TeamsPage } from './pages/TeamsPage';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ProfileCompletionCheck } from './components/auth/ProfileCompletionCheck';
import { useAuthStore } from './stores/authStore';
import { useKeepAlive } from './hooks/useKeepAlive';
import { ToastContainer } from './components/common/Toast';
import { PWAInstallPrompt, PWAInstallButton } from './components/common/PWAInstallPrompt';
import { OnboardingTour } from './components/common/OnboardingTour';
import * as serviceWorker from './utils/serviceWorker';
import { getAccessToken } from './api/client';
import './app.css';

// Admin pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { EmailManagement, UserManagement, TeamManagement } from './pages/admin/AdminDashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  const { refreshUser } = useAuthStore();
  
  // Keep the backend alive to prevent Render free tier from sleeping
  useKeepAlive();

  useEffect(() => {
    // Try to refresh user on app load if token exists
    const token = getAccessToken();
    if (token) {
      refreshUser();
    }
  }, [refreshUser]);

  useEffect(() => {
    // Initialize PWA features
    serviceWorker.initializePWA();
    
    // Register service worker
    serviceWorker.register({
      onSuccess: (registration) => {
        console.log('Service Worker registered successfully:', registration);
      },
      onUpdate: (registration) => {
        console.log('New content available, please refresh:', registration);
        // You could show a toast here to prompt the user to refresh
      },
      onError: (error) => {
        console.error('Service Worker registration failed:', error);
      },
    });
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/emails" replace />} />
                <Route path="emails" element={<EmailManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="teams" element={<TeamManagement />} />
              </Route>
            </Route>
          </Routes>
          <ToastContainer />
          <PWAInstallPrompt />
          <PWAInstallButton />
          <OnboardingTour />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
