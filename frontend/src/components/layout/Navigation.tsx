import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, UserCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface NavigationProps {
  onNavigate?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onNavigate }) => {
  const { isAdmin } = useAuthStore();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/availability', icon: Calendar, label: 'Availability' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
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
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}; 