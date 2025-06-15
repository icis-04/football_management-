import React, { useEffect, useState } from 'react';
import { format, differenceInHours, differenceInMinutes, isAfter, startOfDay } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';

import { CalendarDaysIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Match {
  id: string;
  date: Date;
  dayOfWeek: 'Monday' | 'Wednesday';
  availabilityDeadline: Date;
  currentAvailability?: 'available' | 'not_available' | null;
  confirmedPlayers: Array<{
    id: number;
    name: string;
    position: string;
    profilePicUrl?: string;
  }>;
  totalAvailable: number;
}

interface CountdownTime {
  hours: number;
  minutes: number;
  expired: boolean;
}

export const AvailabilityPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [countdowns, setCountdowns] = useState<Record<string, CountdownTime>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [availabilityHistory, setAvailabilityHistory] = useState<Array<{
    date: Date;
    wasAvailable: boolean;
    matchPlayed: boolean;
  }>>([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    // Update countdown every minute
    const interval = setInterval(() => {
      updateCountdowns();
    }, 60000); // 1 minute

    // Initial countdown update
    updateCountdowns();

    return () => clearInterval(interval);
  }, [matches]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      
      // Mock data
      const today = new Date();
      const nextMonday = getNextWeekday(today, 1);
      const nextWednesday = getNextWeekday(today, 3);
      
      const mockMatches: Match[] = [
        {
          id: '1',
          date: nextMonday,
          dayOfWeek: 'Monday',
          availabilityDeadline: new Date(nextMonday.getTime()),
          currentAvailability: null,
          confirmedPlayers: [
            { id: 1, name: 'John Doe', position: 'midfielder' },
            { id: 2, name: 'Jane Smith', position: 'defender' },
            { id: 3, name: 'Mike Johnson', position: 'forward' },
            { id: 4, name: 'Sarah Williams', position: 'goalkeeper' },
          ],
          totalAvailable: 12,
        },
        {
          id: '2',
          date: nextWednesday,
          dayOfWeek: 'Wednesday',
          availabilityDeadline: new Date(nextWednesday.getTime()),
          currentAvailability: 'available',
          confirmedPlayers: [
            { id: 1, name: 'John Doe', position: 'midfielder' },
            { id: 5, name: 'Tom Brown', position: 'defender' },
            { id: 6, name: 'Emma Davis', position: 'forward' },
          ],
          totalAvailable: 18,
        },
      ];

      // Set deadline to 12 PM on match day
      mockMatches.forEach(match => {
        match.availabilityDeadline.setHours(12, 0, 0, 0);
      });

      setMatches(mockMatches);
      
      // Mock availability history
      setAvailabilityHistory([
        { date: new Date('2025-01-13'), wasAvailable: true, matchPlayed: true },
        { date: new Date('2025-01-08'), wasAvailable: false, matchPlayed: true },
        { date: new Date('2025-01-06'), wasAvailable: true, matchPlayed: true },
        { date: new Date('2025-01-01'), wasAvailable: true, matchPlayed: false },
      ]);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextWeekday = (date: Date, dayOfWeek: number): Date => {
    const result = new Date(date);
    const currentDay = result.getDay();
    const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntilNext);
    return startOfDay(result);
  };

  const updateCountdowns = () => {
    const now = new Date();
    const newCountdowns: Record<string, CountdownTime> = {};

    matches.forEach(match => {
      const deadline = match.availabilityDeadline;
      const hoursLeft = differenceInHours(deadline, now);
      const minutesLeft = differenceInMinutes(deadline, now) % 60;
      
      newCountdowns[match.id] = {
        hours: Math.max(0, hoursLeft),
        minutes: Math.max(0, minutesLeft),
        expired: isAfter(now, deadline),
      };
    });

    setCountdowns(newCountdowns);
  };

  const submitAvailability = async (matchId: string, isAvailable: boolean) => {
    try {
      setSubmitting(true);
      // TODO: Replace with actual API call
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setMatches(prevMatches =>
        prevMatches.map(match =>
          match.id === matchId
            ? {
                ...match,
                currentAvailability: isAvailable ? 'available' : 'not_available',
                totalAvailable: isAvailable
                  ? match.totalAvailable + 1
                  : Math.max(0, match.totalAvailable - 1),
              }
            : match
        )
      );
    } catch (error) {
      console.error('Error submitting availability:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityButton = (match: Match) => {
    const countdown = countdowns[match.id];
    const isDeadlinePassed = countdown?.expired;

    if (isDeadlinePassed) {
      return (
        <div className="text-sm text-gray-500">
          Deadline passed
        </div>
      );
    }

    if (match.currentAvailability === null) {
      return (
        <div className="flex space-x-2">
          <Button
            onClick={() => submitAvailability(match.id, true)}
            disabled={submitting}
            variant="primary"
            size="sm"
            className="flex items-center space-x-1"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Available</span>
          </Button>
          <Button
            onClick={() => submitAvailability(match.id, false)}
            disabled={submitting}
            variant="secondary"
            size="sm"
            className="flex items-center space-x-1"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Not Available</span>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {match.currentAvailability === 'available' ? (
            <>
              <CheckIcon className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">Available</span>
            </>
          ) : (
            <>
              <XMarkIcon className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Not Available</span>
            </>
          )}
        </div>
        <Button
          onClick={() => submitAvailability(match.id, match.currentAvailability !== 'available')}
          disabled={submitting}
          variant="secondary"
          size="sm"
        >
          Change
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Match Availability</h1>
        <p className="text-gray-600 mt-2">
          Submit your availability for upcoming matches before the deadline
        </p>
      </div>

      {/* Matches */}
      {matches.map(match => {
        const countdown = countdowns[match.id];
        const showPlayersList = match.currentAvailability !== null || countdown?.expired;

        return (
          <Card key={match.id} className="overflow-hidden">
            <div className="p-6">
              {/* Match Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
                    <span>{match.dayOfWeek} Match</span>
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {format(match.date, 'MMMM d, yyyy')}
                  </p>
                </div>
                
                {/* Countdown Timer */}
                {countdown && !countdown.expired && (
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <ClockIcon className="w-5 h-5" />
                      <span className="text-sm">Deadline in</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {countdown.hours}h {countdown.minutes}m
                    </div>
                  </div>
                )}
              </div>

              {/* Availability Status */}
              <div className="border-t border-b py-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      {match.totalAvailable} players confirmed
                    </span>
                  </div>
                  {getAvailabilityButton(match)}
                </div>
              </div>

              {/* Confirmed Players List */}
              {showPlayersList && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">
                    Confirmed Players
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {match.confirmedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {player.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {player.position}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {match.totalAvailable > match.confirmedPlayers.length && (
                    <p className="text-sm text-gray-500 mt-3">
                      +{match.totalAvailable - match.confirmedPlayers.length} more players
                    </p>
                  )}
                </div>
              )}

              {/* Submission Info */}
              {!showPlayersList && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Submit your availability to see who else is playing
                  </p>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* No Matches */}
      {matches.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming matches scheduled</p>
          </div>
        </Card>
      )}

      {/* Availability History */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Availability History</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>
          
          {showHistory && (
            <div className="space-y-2">
              {availabilityHistory.length > 0 ? (
                availabilityHistory.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(record.date, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.matchPlayed ? 'Match played' : 'Match cancelled'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {record.wasAvailable ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        record.wasAvailable ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {record.wasAvailable ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No availability history yet
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}; 