import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus as PlusIcon, Calendar, Users, User } from 'lucide-react';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  to: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Calendar,
    label: 'Submit Availability',
    to: '/availability',
    description: 'Update your availability for upcoming matches'
  },
  {
    icon: Users,
    label: 'View Teams',
    to: '/teams',
    description: 'Check current team assignments'
  },
  {
    icon: User,
    label: 'Update Profile',
    to: '/profile',
    description: 'Manage your profile information'
  }
];

export const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setIsOpen(false)}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <action.icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40" data-tour="quick-actions">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            bg-primary hover:bg-primary-dark text-white rounded-full p-4 shadow-lg
            transform transition-all duration-200 hover:scale-110
            ${isOpen ? 'rotate-45' : ''}
          `}
          aria-label="Quick actions menu"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}; 