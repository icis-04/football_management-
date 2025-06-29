import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { promptInstall, isPWA } from '../../utils/serviceWorker';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isPWA()) {
      return;
    }

    // Check if installable
    const checkInstallable = () => {
      // The beforeinstallprompt event will set this
      const installButton = document.getElementById('pwa-install-button');
      if (installButton && installButton.style.display === 'block') {
        setIsInstallable(true);
        
        // Show prompt after 30 seconds
        setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    };

    // Check immediately and after a delay
    checkInstallable();
    setTimeout(checkInstallable, 2000);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
      
      // Show prompt after user has used the app for a bit
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowPrompt(false);
      setIsInstallable(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Don't show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Check if recently dismissed
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <ArrowDownTrayIcon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Install Football Manager
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Install our app for a better experience with offline access and quick launch from your home screen.
          </p>
          <div className="mt-3 flex space-x-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="flex items-center space-x-1"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Install</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Hidden button for PWA detection
export const PWAInstallButton: React.FC = () => {
  return (
    <button
      id="pwa-install-button"
      style={{ display: 'none' }}
      aria-hidden="true"
    />
  );
}; 