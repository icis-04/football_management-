import React from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ToastContainer: React.FC = () => {
  const { notifications, clearNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => clearNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface ToastProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`
        min-w-[300px] max-w-md p-4 rounded-lg border shadow-lg
        ${bgColors[notification.type]}
        animate-in slide-in-from-right duration-300
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[notification.type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
          {notification.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}; 