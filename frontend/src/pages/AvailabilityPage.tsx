import React, { useEffect, useState } from 'react';
import { format, differenceInHours, differenceInMinutes, isAfter } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { CalendarDaysIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { availabilityApi, type Match, type AvailabilityStatus } from '../api/availability';

interface CountdownTime {
  hours: number;
  minutes: number;
  expired: boolean;
}

export const AvailabilityPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myAvailability, setMyAvailability] = useState<AvailabilityStatus[]>([]);
  const [matchAvailability, setMatchAvailability] = useState<Record<string, {
    availablePlayers: Array<{ id: number; name: string; position: string; profilePicUrl?: string }>;
    totalAvailable: number;
  }>>({});
  const [countdowns, setCountdowns] = useState<Record<string, CountdownTime>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch upcoming matches and my availability in parallel
      const [matchesData, availabilityData] = await Promise.all([
        availabilityApi.getUpcomingMatches(),
        availabilityApi.getMyAvailability()
      ]);
      
      setMatches(matchesData);
      setMyAvailability(availabilityData);
      
      // Fetch availability for each match
      const availabilityPromises = matchesData.map(async (match) => {
        try {
          const dateOnly = match.date.split('T')[0];
          const data = await availabilityApi.getMatchAvailability(dateOnly);
          return { date: dateOnly, data };
        } catch (error) {
          console.error(`Error fetching availability for ${match.date}:`, error);
          return { date: match.date.split('T')[0], data: null };
        }
      });
      
      const availabilityResults = await Promise.all(availabilityPromises);
      const availabilityMap: Record<string, {
        availablePlayers: Array<{ id: number; name: string; position: string; profilePicUrl?: string }>;
        totalAvailable: number;
      }> = {};
      
      availabilityResults.forEach(result => {
        if (result.data) {
          availabilityMap[result.date] = {
            availablePlayers: result.data.availablePlayers || [],
            totalAvailable: result.data.totalAvailable || 0
          };
        }
      });
      
      setMatchAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching availability data:', error);
      setError('Failed to load availability data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateCountdowns = () => {
    const now = new Date();
    const newCountdowns: Record<string, CountdownTime> = {};

    matches.forEach(match => {
      const deadline = new Date(match.availabilityDeadline);
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

  const submitAvailability = async (matchId: string, matchDate: string, isAvailable: boolean) => {
    try {
      setSubmitting(true);
      
      // Extract just the date part (YYYY-MM-DD) from the full date string
      const dateOnly = matchDate.split('T')[0];
      
      // Check if we already have availability for this match
      const existingAvailability = myAvailability.find(a => a.matchDate === dateOnly);
      
      if (existingAvailability) {
        // Update existing availability
        await availabilityApi.updateAvailability(dateOnly, { isAvailable });
      } else {
        // Submit new availability
        await availabilityApi.submitAvailability({ matchDate: dateOnly, isAvailable });
      }
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error submitting availability:', error);
      alert('Failed to submit availability. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityButton = (match: Match) => {
    const countdown = countdowns[match.id];
    const isDeadlinePassed = countdown?.expired;
    const matchDateOnly = match.date.split('T')[0];
    const userAvailability = myAvailability.find(a => a.matchDate === matchDateOnly);

    if (isDeadlinePassed) {
      return (
        <div className="text-sm text-gray-500">
          Deadline passed
        </div>
      );
    }

    if (!userAvailability) {
      return (
        <div className="flex space-x-2">
          <Button
            onClick={() => submitAvailability(match.id, match.date, true)}
            disabled={submitting}
            variant="primary"
            size="sm"
            className="flex items-center space-x-1"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Available</span>
          </Button>
          <Button
            onClick={() => submitAvailability(match.id, match.date, false)}
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
          {userAvailability.isAvailable ? (
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
          onClick={() => submitAvailability(match.id, match.date, !userAvailability.isAvailable)}
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

  if (error) {
    return (
      <Card>
        <div className="p-12 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
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
        const matchDateOnly = match.date.split('T')[0];
        const userAvailability = myAvailability.find(a => a.matchDate === matchDateOnly);
        const showPlayersList = userAvailability || countdown?.expired;

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
                    {format(new Date(match.date), 'MMMM d, yyyy')}
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
                      {matchAvailability[matchDateOnly]?.totalAvailable || 0} players confirmed
                    </span>
                  </div>
                  {getAvailabilityButton(match)}
                </div>
              </div>

              {/* Confirmed Players List */}
              {showPlayersList && matchAvailability[matchDateOnly]?.availablePlayers && matchAvailability[matchDateOnly].availablePlayers.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">
                    Confirmed Players
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {matchAvailability[matchDateOnly].availablePlayers.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        {player.profilePicUrl ? (
                          <img 
                            src={player.profilePicUrl} 
                            alt={player.name}
                            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
                        )}
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
              {myAvailability.length > 0 ? (
                myAvailability.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(record.matchDate), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted {format(new Date(record.submittedAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {record.isAvailable ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        record.isAvailable ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {record.isAvailable ? 'Available' : 'Not Available'}
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