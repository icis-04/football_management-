import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/solid';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

type AvailabilityStatusType = 'available' | 'unavailable' | 'maybe' | null;

interface SwipeableAvailabilityCardProps {
  date: Date;
  dayOfWeek: string;
  status: AvailabilityStatusType;
  onChange: (date: Date, status: AvailabilityStatusType) => void;
  isLoading?: boolean;
}

export const SwipeableAvailabilityCard: React.FC<SwipeableAvailabilityCardProps> = ({
  date,
  dayOfWeek,
  status,
  onChange,
  isLoading = false,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwipe = (newStatus: AvailabilityStatusType) => {
    if (isLoading || status === newStatus) return;
    
    setIsAnimating(true);
    onChange(date, newStatus);
    
    // Reset animation after a short delay
    setTimeout(() => {
      setSwipeOffset(0);
      setIsAnimating(false);
    }, 300);
  };

  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: () => {
      if (status === 'available') {
        handleSwipe('maybe');
      } else if (status === 'maybe') {
        handleSwipe('unavailable');
      }
    },
    onSwipeRight: () => {
      if (status === 'unavailable') {
        handleSwipe('maybe');
      } else if (status === 'maybe') {
        handleSwipe('available');
      }
    },
  });

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700';
      case 'unavailable':
        return 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700';
      case 'maybe':
        return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'available':
        return <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'unavailable':
        return <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'maybe':
        return <MinusIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={swipeRef}
      className={`
        relative overflow-hidden rounded-lg border-2 p-4 cursor-pointer
        transition-all duration-300 select-none
        ${getStatusColor()}
        ${isAnimating ? 'scale-95' : 'scale-100'}
        ${isLoading ? 'opacity-50' : 'opacity-100'}
      `}
      style={{
        transform: `translateX(${swipeOffset}px)`,
      }}
    >
      {/* Swipe indicators */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-green-400/20 to-transparent pointer-events-none opacity-0 transition-opacity">
        <CheckIcon className="h-6 w-6 text-green-600 absolute left-2 top-1/2 -translate-y-1/2" />
      </div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-red-400/20 to-transparent pointer-events-none opacity-0 transition-opacity">
        <XMarkIcon className="h-6 w-6 text-red-600 absolute right-2 top-1/2 -translate-y-1/2" />
      </div>

      {/* Card content */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{dayOfWeek}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {format(date, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {status || 'Not set'}
          </span>
        </div>
      </div>

      {/* Mobile hint */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center md:hidden">
        Swipe left/right to change
      </div>
    </div>
  );
}; 