import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export const AdminLayout: React.FC = () => {
  const navItems = [
    { path: '/admin/emails', label: 'Email Management', icon: EnvelopeIcon },
    { path: '/admin/users', label: 'User Management', icon: UserGroupIcon },
    { path: '/admin/teams', label: 'Team Management', icon: ClipboardDocumentListIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, teams, and system settings
        </p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <nav className="flex space-x-8 px-6" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content - This is where the nested routes will render */}
      <Outlet />
    </div>
  );
}; 