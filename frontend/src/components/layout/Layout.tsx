import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { AdminToolbar } from './AdminToolbar';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { QuickActions } from '../common/QuickActions';
import { useAuthStore } from '../../stores/authStore';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin || false;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      
      <Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
      {isAdmin && <AdminToolbar />}
      <div className="flex relative">
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>
        
        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
              <Navigation onNavigate={toggleMobileMenu} />
            </div>
          </div>
        )}
        
        <main id="main-content" className="flex-1 p-4 sm:p-6 w-full">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
      <QuickActions />
    </div>
  );
}; 