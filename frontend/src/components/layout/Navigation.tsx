import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, UserCircle, Shield, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface NavigationProps {
  onNavigate?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onNavigate }) => {
  const { isAdmin, user } = useAuthStore();
  
  const isProfileIncomplete = !user?.preferredPosition || user.preferredPosition === 'any';

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/availability', icon: Calendar, label: 'Availability' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/profile', icon: UserCircle, label: 'Profile', showAlert: isProfileIncomplete },
  ];

  return (
    <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)]" data-tour="navigation">
      <div className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                data-tour={item.to === '/profile' ? 'profile-link' : item.to === '/availability' ? 'availability-link' : item.to === '/teams' ? 'teams-link' : undefined}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.showAlert && (
                  <AlertCircle className="h-4 w-4 text-amber-500 ml-auto" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8 pt-8 border-t dark:border-gray-700">
            <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Administration
            </p>
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium">Admin Panel</span>
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}; 