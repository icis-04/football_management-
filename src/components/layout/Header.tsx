import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Football Team Manager
          </h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <User className="h-5 w-5" />
              <span className="font-medium">{user?.name}</span>
            </button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}; 