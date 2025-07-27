import { useEffect, useState } from 'react';

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      // Update theme-color meta tag for dark mode
      updateThemeColor('#111827'); // gray-900
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      // Update theme-color meta tag for light mode
      updateThemeColor('#f9fafb'); // gray-50
    }
    
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const updateThemeColor = (color: string) => {
    // Update or create theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return { isDarkMode, toggleDarkMode };
}; 