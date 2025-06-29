import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isMonday, isWednesday, isBefore, startOfDay } from 'date-fns';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { Match, AvailabilityStatus } from '../../api/availability';

interface CalendarViewProps {
  matches: Match[];
  myAvailability: AvailabilityStatus[];
  onDateClick: (date: Date, match?: Match) => void;
  currentMonth: Date;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  matches,
  myAvailability,
  onDateClick,
  currentMonth
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the first day of the week (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);
  
  // Add empty cells for days before month starts
  const emptyCells = Array(startDayOfWeek).fill(null);
  
  const getMatchForDate = (date: Date): Match | undefined => {
    return matches.find(match => {
      const matchDate = new Date(match.date);
      return isSameDay(matchDate, date);
    });
  };
  
  const getAvailabilityForDate = (date: Date): AvailabilityStatus | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return myAvailability.find(a => a.matchDate === dateStr);
  };
  
  const isMatchDay = (date: Date): boolean => {
    return isMonday(date) || isWednesday(date);
  };
  
  const isPastDate = (date: Date): boolean => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
      </div>
      
      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-0 border-b dark:border-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Empty cells */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square border-r dark:border-gray-700 border-b dark:border-gray-700" />
        ))}
        
        {/* Days */}
        {days.map(day => {
          const match = getMatchForDate(day);
          const availability = getAvailabilityForDate(day);
          const isMatch = isMatchDay(day);
          const isPast = isPastDate(day);
          const hasDeadlinePassed = match && new Date(match.availabilityDeadline) < new Date();
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick(day, match)}
              disabled={isPast || !isMatch || hasDeadlinePassed}
              className={`
                aspect-square border-r dark:border-gray-700 border-b dark:border-gray-700 p-2 text-left transition-colors relative
                ${isMatch && !isPast ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                ${isPast ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600' : ''}
                ${isMatch && !isPast && !hasDeadlinePassed ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <div className="text-sm font-medium mb-1 dark:text-white">
                {format(day, 'd')}
              </div>
              
              {isMatch && (
                <div className="absolute bottom-2 left-2 right-2">
                  {availability ? (
                    <div className="flex items-center justify-center">
                      {availability.isAvailable ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  ) : match && !hasDeadlinePassed && !isPast ? (
                    <div className="h-5 w-5 mx-auto rounded-full border-2 border-dashed border-gray-400 dark:border-gray-600" />
                  ) : null}
                  
                  {match && (
                    <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                      {isMonday(day) ? 'Mon' : 'Wed'}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="px-6 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="dark:text-gray-300">Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircleIcon className="h-4 w-4 text-red-500" />
            <span className="dark:text-gray-300">Not Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-4 w-4 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-600" />
            <span className="dark:text-gray-300">Not Submitted</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 