import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Mail, Users, ChartBar, Wrench } from 'lucide-react';

export const AdminToolbar: React.FC = () => {
  const location = useLocation();
  
  const adminLinks = [
    { to: '/admin/emails', icon: Mail, label: 'Emails' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/teams', icon: Wrench, label: 'Teams' },
    { to: '/admin/analytics', icon: ChartBar, label: 'Analytics' },
  ];

  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (!isAdminRoute) return null;

  return (
    <div className="bg-gray-900 text-white">
      <div className="px-4 sm:px-6 py-2">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
          <nav className="flex space-x-4">
            {adminLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}; 