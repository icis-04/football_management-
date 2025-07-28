import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  run = false, 
  onComplete 
}) => {
  const [tourRun, setTourRun] = useState(run);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Check if user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding-tour-completed');
    const isNewUser = user && !hasSeenTour;
    
    if (isNewUser && location.pathname === '/dashboard') {
      // Start tour for new users on dashboard
      setTimeout(() => setTourRun(true), 1000);
    }
  }, [user, location]);

  // Define tour steps - adjust for mobile
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-2`}>Welcome to Football Manager! ⚽</h2>
          <p className={isMobile ? 'text-sm' : ''}>Let's take a quick tour to help you get started.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: isMobile ? '[data-tour="mobile-menu"]' : '[data-tour="navigation"]',
      content: isMobile 
        ? 'Tap the menu icon to navigate between sections.' 
        : 'Use the navigation menu to access different sections of the app.',
      placement: isMobile ? 'bottom' : 'right',
      spotlightPadding: isMobile ? 5 : 10,
    },
    {
      target: '[data-tour="profile-link"]',
      content: 'Complete your profile here to set your preferred position and upload a photo.',
      placement: isMobile ? 'top' : 'bottom',
      spotlightPadding: isMobile ? 5 : 10,
    },
    {
      target: '[data-tour="availability-link"]',
      content: 'Submit your availability for upcoming matches here. This is the most important feature!',
      placement: isMobile ? 'top' : 'right',
      spotlightPadding: isMobile ? 5 : 10,
    },
    {
      target: '[data-tour="teams-link"]',
      content: 'View the teams for upcoming matches once they are published.',
      placement: isMobile ? 'top' : 'right',
      spotlightPadding: isMobile ? 5 : 10,
    },
    {
      target: '[data-tour="dashboard-stats"]',
      content: 'Your dashboard shows important stats and upcoming matches at a glance.',
      placement: 'top',
      spotlightPadding: isMobile ? 5 : 10,
    },
    {
      target: '[data-tour="quick-actions"]',
      content: 'Use quick actions for common tasks like submitting availability.',
      placement: isMobile ? 'top' : 'left',
      spotlightPadding: isMobile ? 5 : 10,
    },
    {
      target: '[data-tour="dark-mode"]',
      content: 'Toggle between light and dark mode for comfortable viewing.',
      placement: 'bottom',
      spotlightPadding: isMobile ? 5 : 10,
    },
  ];
  
  // Skip search step on mobile as it's not as relevant
  if (!isMobile) {
    steps.push({
      target: '[data-tour="search"]',
      content: 'Search for players, teams, or dates quickly with Cmd/Ctrl + K.',
      placement: 'bottom',
      spotlightPadding: 10,
    });
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data;

    if (type === 'step:after') {
      // Update step index
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Mark tour as completed
      localStorage.setItem('onboarding-tour-completed', 'true');
      setTourRun(false);
      onComplete?.();
      
      // Navigate to availability page after tour
      if (status === STATUS.FINISHED) {
        navigate('/availability');
      }
    }
  };

  const tourStyles = {
    options: {
      primaryColor: '#3b82f6',
      zIndex: 10000,
      overlayColor: isMobile ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
    spotlight: {
      backgroundColor: 'transparent',
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      color: '#1f2937',
      fontSize: isMobile ? '13px' : '14px',
      padding: isMobile ? '12px' : '16px',
      maxWidth: isMobile ? '280px' : '360px',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: isMobile ? '15px' : '16px',
      fontWeight: 'bold',
    },
    buttonNext: {
      backgroundColor: '#3b82f6',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: isMobile ? '13px' : '14px',
      padding: isMobile ? '10px 20px' : '8px 16px',
      minWidth: isMobile ? '80px' : 'auto',
    },
    buttonBack: {
      color: '#6b7280',
      fontSize: isMobile ? '13px' : '14px',
      marginRight: '8px',
      padding: isMobile ? '10px 15px' : '8px 12px',
    },
    buttonSkip: {
      color: '#6b7280',
      fontSize: isMobile ? '13px' : '14px',
      padding: isMobile ? '10px 15px' : '8px 12px',
    },
    tooltipFooter: {
      marginTop: isMobile ? '12px' : '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={tourRun}
      scrollToFirstStep
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      steps={steps}
      styles={tourStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
};

// Hook to trigger tour manually
export const useOnboardingTour = () => {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => {
    setShowTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem('onboarding-tour-completed');
    setShowTour(true);
  };

  return {
    showTour,
    startTour,
    resetTour,
  };
}; 