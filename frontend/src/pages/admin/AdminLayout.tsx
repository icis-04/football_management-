import React from 'react';
import { Outlet } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage users, teams, and system settings
        </p>
      </div>

      {/* Content - This is where the nested routes will render */}
      <Outlet />
    </div>
  );
}; 