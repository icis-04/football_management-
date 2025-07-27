import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProfileCompletionCheckProps {
  children: React.ReactNode;
}

export const ProfileCompletionCheck: React.FC<ProfileCompletionCheckProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    // Skip check if user is not authenticated or is on profile/auth pages
    if (!user || location.pathname === '/profile' || location.pathname.startsWith('/login') || location.pathname.startsWith('/signup')) {
      return;
    }

    // Skip profile completion check for admin users
    if (user.isAdmin) {
      return;
    }

    // Check if profile is incomplete (no name or position set to default)
    const isProfileIncomplete = !user.name || user.preferredPosition === 'any';
    
    // For new users (created within last 24 hours), redirect to profile if incomplete
    if (isProfileIncomplete && user.createdAt) {
      const accountAge = Date.now() - new Date(user.createdAt).getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (accountAge < oneDayInMs) {
        navigate('/profile', { 
          state: { 
            message: 'Please complete your profile to continue',
            from: location.pathname 
          } 
        });
      }
    }
  }, [user, navigate, location]);

  return <>{children}</>;
}; 