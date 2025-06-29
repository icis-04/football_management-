import React, { useState } from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Button } from '../common/Button';

type AvailabilityStatusType = 'available' | 'unavailable' | 'maybe' | null;

interface Match {
  date: Date;
  dayOfWeek: string;
  status: AvailabilityStatusType;
}

interface BulkAvailabilitySelectorProps {
  matches: Match[];
  onBulkSubmit: (updates: { date: Date; status: AvailabilityStatusType }[]) => void;
  isLoading?: boolean;
}

export const BulkAvailabilitySelector: React.FC<BulkAvailabilitySelectorProps> = ({
  matches,
  onBulkSubmit,
  isLoading = false,
}) => {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<AvailabilityStatusType>('available');
  const [isSelecting, setIsSelecting] = useState(false);

  const today = startOfDay(new Date());
  const futureMatches = matches.filter(match => isAfter(match.date, today));

  const toggleDateSelection = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newSelected = new Set(selectedDates);
    
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    
    setSelectedDates(newSelected);
  };

  const selectAll = () => {
    const allDates = new Set(
      futureMatches.map(match => format(match.date, 'yyyy-MM-dd'))
    );
    setSelectedDates(allDates);
  };

  const deselectAll = () => {
    setSelectedDates(new Set());
  };

  const handleBulkSubmit = () => {
    const updates = Array.from(selectedDates).map(dateStr => {
      const match = matches.find(m => format(m.date, 'yyyy-MM-dd') === dateStr);
      return {
        date: match!.date,
        status: bulkStatus,
      };
    });

    onBulkSubmit(updates);
    setSelectedDates(new Set());
    setIsSelecting(false);
  };

  if (!isSelecting) {
    return (
      <Button
        onClick={() => setIsSelecting(true)}
        variant="secondary"
        className="w-full"
      >
        Bulk Update Availability
      </Button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bulk Update Availability
        </h3>
        <button
          onClick={() => setIsSelecting(false)}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          Cancel
        </button>
      </div>

      {/* Status Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Set selected dates to:
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setBulkStatus('available')}
            className={`
              px-3 py-2 rounded-lg border-2 transition-colors
              ${bulkStatus === 'available'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            Available
          </button>
          <button
            onClick={() => setBulkStatus('maybe')}
            className={`
              px-3 py-2 rounded-lg border-2 transition-colors
              ${bulkStatus === 'maybe'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            Maybe
          </button>
          <button
            onClick={() => setBulkStatus('unavailable')}
            className={`
              px-3 py-2 rounded-lg border-2 transition-colors
              ${bulkStatus === 'unavailable'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            Unavailable
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select dates:
          </label>
          <div className="space-x-2">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {futureMatches.map(match => {
            const dateStr = format(match.date, 'yyyy-MM-dd');
            const isSelected = selectedDates.has(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => toggleDateSelection(match.date)}
                className={`
                  relative p-3 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                {isSelected && (
                  <CheckIcon className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {match.dayOfWeek}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(match.date, 'MMM d')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          onClick={handleBulkSubmit}
          disabled={selectedDates.size === 0 || isLoading}
          className="flex-1"
        >
          Update {selectedDates.size} {selectedDates.size === 1 ? 'Date' : 'Dates'}
        </Button>
        <Button
          onClick={() => {
            setSelectedDates(new Set());
            setIsSelecting(false);
          }}
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}; 