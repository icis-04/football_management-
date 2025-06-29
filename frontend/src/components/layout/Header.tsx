import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { GlobalSearch } from '../common/GlobalSearch';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            <Link to="/dashboard" className="ml-2 md:ml-0 flex items-center">
              <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">Football Manager</span>
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setShowMobileSearch(true)}
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            
            {/* Global Search - Hidden on very small screens */}
            <div className="hidden sm:block" data-tour="search">
              <GlobalSearch />
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              data-tour="dark-mode"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-2">
                <span className="hidden lg:block text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <GlobalSearch 
          isMobileTriggered={true} 
          onClose={() => setShowMobileSearch(false)} 
        />
      )}
    </header>
  );
}; 