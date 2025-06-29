import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

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

  // Check if user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding-tour-completed');
    const isNewUser = user && !hasSeenTour;
    
    if (isNewUser && location.pathname === '/dashboard') {
      // Start tour for new users on dashboard
      setTimeout(() => setTourRun(true), 1000);
    }
  }, [user, location]);

  // Define tour steps
  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Welcome to Football Manager! ⚽</h2>
          <p>Let's take a quick tour to help you get started.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="navigation"]',
      content: 'Use the navigation menu to access different sections of the app.',
      placement: 'right',
    },
    {
      target: '[data-tour="profile-link"]',
      content: 'Complete your profile here to set your preferred position and upload a photo.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="availability-link"]',
      content: 'Submit your availability for upcoming matches here. This is the most important feature!',
      placement: 'right',
    },
    {
      target: '[data-tour="teams-link"]',
      content: 'View the teams for upcoming matches once they are published.',
      placement: 'right',
    },
    {
      target: '[data-tour="dashboard-stats"]',
      content: 'Your dashboard shows important stats and upcoming matches at a glance.',
      placement: 'top',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: 'Use quick actions for common tasks like submitting availability.',
      placement: 'left',
    },
    {
      target: '[data-tour="dark-mode"]',
      content: 'Toggle between light and dark mode for comfortable viewing.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="search"]',
      content: 'Search for players, teams, or dates quickly with Cmd/Ctrl + K.',
      placement: 'bottom',
    },
  ];

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
    },
    spotlight: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      color: '#1f2937',
      fontSize: '14px',
      padding: '16px',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
    },
    buttonNext: {
      backgroundColor: '#3b82f6',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '14px',
      padding: '8px 16px',
    },
    buttonBack: {
      color: '#6b7280',
      fontSize: '14px',
      marginRight: '8px',
    },
    buttonSkip: {
      color: '#6b7280',
      fontSize: '14px',
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