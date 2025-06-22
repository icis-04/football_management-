import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
      <div className="flex relative">
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>
        
        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
              <Navigation onNavigate={toggleMobileMenu} />
            </div>
          </div>
        )}
        
        <main className="flex-1 p-4 sm:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}; 