import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  // Generate breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    return {
      path,
      label,
      isLast: index === pathSegments.length - 1
    };
  });

  // Add home as the first item
  const allItems = [
    { path: '/dashboard', label: 'Home', isLast: pathSegments.length === 0 },
    ...breadcrumbItems
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
      {allItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index === 0 ? (
            <Link
              to={item.path}
              className={`flex items-center hover:text-gray-900 dark:hover:text-white ${
                item.isLast ? 'text-gray-900 dark:text-white font-medium' : ''
              }`}
            >
              <Home className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              {item.isLast ? (
                <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-gray-900 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              )}
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}; 