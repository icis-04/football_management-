import React, { useEffect, useState } from 'react';
import { format, isAfter, parseISO, differenceInSeconds, addMonths, subMonths } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Skeleton, SkeletonGroup } from '../components/common/Skeleton';
import { CalendarDaysIcon, ClockIcon, UserGroupIcon, DocumentDuplicateIcon, ViewColumnsIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { availabilityApi, type Match, type AvailabilityStatus } from '../api/availability';
import { EmptyState } from '../components/common/EmptyState';
import { CalendarView } from '../components/availability/CalendarView';
import { getUploadUrl } from '../api/client';
import { useOptimisticUpdate, useOptimisticState } from '../hooks/useOptimisticUpdate';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export const AvailabilityPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const { value: myAvailability, setOptimisticValue: setOptimisticAvailability, rollback: rollbackAvailability, commit: commitAvailability, setValue: setMyAvailability } = useOptimisticState<AvailabilityStatus[]>([]);
  const [matchAvailability, setMatchAvailability] = useState<Record<string, {
    totalAvailable: number;
    availablePlayers: Array<{
      id: number;
      name: string;
      position: string;
      profilePicUrl?: string;
    }>;
  }>>({});
  const [countdowns, setCountdowns] = useState<Record<string, CountdownTime>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyingFromLastWeek, setCopyingFromLastWeek] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { executeUpdate: executeAvailabilityUpdate } = useOptimisticUpdate(
    async ({ matchDate, isAvailable }: { matchDate: string; isAvailable: boolean }) => {
      const existingAvailability = myAvailability.find(a => a.matchDate === matchDate);
      
      if (existingAvailability) {
        // Update existing availability
        return await availabilityApi.updateAvailability(matchDate, { isAvailable });
      } else {
        // Submit new availability
        return await availabilityApi.submitAvailability({ matchDate, isAvailable });
      }
    },
    {
      rollbackMessage: 'Failed to update availability. Your changes have been reverted.',
    }
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000); // 1 second

    // Initial countdown update
    updateCountdowns();

    return () => clearInterval(interval);
  }, [matches]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [matchesData, myAvailabilityData] = await Promise.all([
        availabilityApi.getUpcomingMatches(),
        availabilityApi.getMyAvailability()
      ]);
      
      setMatches(matchesData);
      setMyAvailability(myAvailabilityData);
      commitAvailability(myAvailabilityData); // Commit the fetched data
      
      // Fetch availability for each match
      const availabilityPromises = matchesData.map(async (match) => {
        try {
          const matchDateOnly = match.date.split('T')[0];
          const availability = await availabilityApi.getMatchAvailability(matchDateOnly);
          return { matchDateOnly, availability };
        } catch (error) {
          console.error(`Error fetching availability for ${match.date}:`, error);
          return null;
        }
      });
      
      const availabilityResults = await Promise.all(availabilityPromises);
      const availabilityMap: typeof matchAvailability = {};
      
      availabilityResults.forEach(result => {
        if (result) {
          availabilityMap[result.matchDateOnly] = result.availability;
        }
      });
      
      setMatchAvailability(availabilityMap);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load availability data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateCountdowns = () => {
    const now = new Date();
    const newCountdowns: Record<string, CountdownTime> = {};

    matches.forEach(match => {
      const deadline = new Date(match.availabilityDeadline);
      const totalSeconds = differenceInSeconds(deadline, now);
      const hoursLeft = Math.floor(totalSeconds / 3600);
      const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
      const secondsLeft = totalSeconds % 60;
      
      newCountdowns[match.id] = {
        hours: Math.max(0, hoursLeft),
        minutes: Math.max(0, minutesLeft),
        seconds: Math.max(0, secondsLeft),
        expired: isAfter(now, deadline),
      };
    });

    setCountdowns(newCountdowns);
  };

  const submitAvailability = async (_matchId: string, matchDate: string, isAvailable: boolean) => {
    try {
      setSubmitting(true);
      
      // Extract just the date part (YYYY-MM-DD) from the full date string
      const dateOnly = matchDate.split('T')[0];
      
      await executeAvailabilityUpdate(
        { matchDate: dateOnly, isAvailable },
        () => {
          // Optimistically update the availability
          const existingIndex = myAvailability.findIndex(a => a.matchDate === dateOnly);
          const newAvailability: AvailabilityStatus = {
            matchDate: dateOnly,
            isAvailable,
            submittedAt: new Date().toISOString(),
          };
          
          if (existingIndex >= 0) {
            const updated = [...myAvailability];
            updated[existingIndex] = newAvailability;
            setOptimisticAvailability(updated);
          } else {
            setOptimisticAvailability([...myAvailability, newAvailability]);
          }
          
          // Optimistically update match availability count
          setMatchAvailability(prev => {
            const current = prev[dateOnly] || { totalAvailable: 0, availablePlayers: [] };
            const wasAvailable = myAvailability.find(a => a.matchDate === dateOnly)?.isAvailable;
            
            let newTotal = current.totalAvailable;
            if (wasAvailable === undefined && isAvailable) {
              newTotal += 1;
            } else if (wasAvailable === true && !isAvailable) {
              newTotal = Math.max(0, newTotal - 1);
            } else if (wasAvailable === false && isAvailable) {
              newTotal += 1;
            }
            
            return {
              ...prev,
              [dateOnly]: {
                ...current,
                totalAvailable: newTotal,
              },
            };
          });
        },
        () => {
          // Rollback function
          rollbackAvailability();
          // Also rollback match availability - just refetch
          fetchData();
        }
      );
      
      // After successful update, commit the changes and refresh player list
      commitAvailability();
      
      // Fetch updated player list for this match
      try {
        const availability = await availabilityApi.getMatchAvailability(dateOnly);
        setMatchAvailability(prev => ({
          ...prev,
          [dateOnly]: availability,
        }));
      } catch {
        console.error('Error fetching updated player list');
      }
    } catch {
      // Error is already handled by the optimistic update hook
    } finally {
      setSubmitting(false);
    }
  };

  const copyFromLastWeek = async () => {
    try {
      setCopyingFromLastWeek(true);
      
      // Get last week's availability from history
      const lastWeekAvailability = new Map<string, boolean>();
      
      myAvailability.forEach(availability => {
        const availDate = parseISO(availability.matchDate);
        const dayOfWeek = availDate.getDay();
        
        // Store availability by day of week (1 = Monday, 3 = Wednesday)
        if (dayOfWeek === 1 || dayOfWeek === 3) {
          lastWeekAvailability.set(dayOfWeek.toString(), availability.isAvailable);
        }
      });
      
      if (lastWeekAvailability.size === 0) {
        alert('No previous availability found to copy from.');
        return;
      }
      
      // Apply last week's pattern to upcoming matches
      const submissionPromises = matches.map(async (match) => {
        const countdown = countdowns[match.id];
        if (countdown?.expired) return; // Skip expired matches
        
        const matchDate = parseISO(match.date);
        const matchDayOfWeek = matchDate.getDay();
        const matchDateOnly = match.date.split('T')[0];
        
        // Check if we already have availability for this match
        const existingAvailability = myAvailability.find(a => a.matchDate === matchDateOnly);
        if (existingAvailability) return; // Skip if already submitted
        
        // Get last week's availability for this day
        const lastWeekValue = lastWeekAvailability.get(matchDayOfWeek.toString());
        if (lastWeekValue !== undefined) {
          await availabilityApi.submitAvailability({
            matchDate: matchDateOnly,
            isAvailable: lastWeekValue
          });
        }
      });
      
      await Promise.all(submissionPromises);
      
      // Refresh data
      await fetchData();
      
      alert('Successfully copied availability from previous submissions!');
    } catch (error) {
      console.error('Error copying from last week:', error);
      alert('Failed to copy availability. Please try again.');
    } finally {
      setCopyingFromLastWeek(false);
    }
  };

  const getAvailabilityButton = (match: Match) => {
    const countdown = countdowns[match.id];
    const isDeadlinePassed = countdown?.expired;
    const matchDateOnly = match.date.split('T')[0];
    const userAvailability = myAvailability.find(a => a.matchDate === matchDateOnly);

    if (isDeadlinePassed) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
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

  const handleCalendarDateClick = async (date: Date, match?: Match) => {
    if (!match) return;
    
    const matchDateOnly = format(date, 'yyyy-MM-dd');
    const existingAvailability = myAvailability.find(a => a.matchDate === matchDateOnly);
    
    // Toggle availability or set to available if not submitted
    const newIsAvailable = existingAvailability ? !existingAvailability.isAvailable : true;
    
    await submitAvailability(match.id, match.date, newIsAvailable);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Skeleton variant="text" height={32} width="40%" className="mb-2" />
          <Skeleton variant="text" height={20} width="60%" />
        </div>
        
        {/* Match Cards Skeleton */}
        <SkeletonGroup count={2} className="space-y-6">
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Skeleton variant="text" height={24} width={150} className="mb-2" />
                  <Skeleton variant="text" height={20} width={200} />
                </div>
                <div className="text-right">
                  <Skeleton variant="text" height={16} width={100} className="mb-2" />
                  <Skeleton variant="text" height={32} width={80} />
                </div>
              </div>
              <div className="border-t border-b py-4 mb-6">
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" height={20} width={150} />
                  <div className="flex space-x-2">
                    <Skeleton variant="rectangular" height={36} width={100} />
                    <Skeleton variant="rectangular" height={36} width={120} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </SkeletonGroup>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Match Availability</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Submit your availability for upcoming matches before the deadline
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg border ${
                  viewMode === 'list'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                  viewMode === 'calendar'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
            </div>
            
            {viewMode === 'list' && matches.some(m => !countdowns[m.id]?.expired) && (
              <Button
                onClick={copyFromLastWeek}
                disabled={copyingFromLastWeek}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
                <span>Copy from last week</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          <CalendarView
            matches={matches}
            myAvailability={myAvailability}
            onDateClick={handleCalendarDateClick}
            currentMonth={currentMonth}
          />
        </div>
      ) : (
        /* List View - existing matches display */
        <>
          {matches.slice(0, 2).map(match => {
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
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
                        <span>{match.dayOfWeek} Match</span>
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {format(new Date(match.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    
                    {/* Countdown Timer */}
                    {countdown && !countdown.expired && (
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                          <ClockIcon className="w-5 h-5" />
                          <span className="text-sm">Deadline in</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Availability Status */}
                  <div className="border-t dark:border-gray-700 border-b dark:border-gray-700 py-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {matchAvailability[matchDateOnly]?.totalAvailable || 0} players confirmed
                        </span>
                      </div>
                      <div>
                        {getAvailabilityButton(match)}
                      </div>
                    </div>
                  </div>

                  {/* Confirmed Players List */}
                  {showPlayersList && matchAvailability[matchDateOnly]?.availablePlayers && matchAvailability[matchDateOnly].availablePlayers.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Confirmed Players
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {matchAvailability[matchDateOnly].availablePlayers.map(player => (
                          <div
                            key={player.id}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {player.profilePicUrl ? (
                              <img 
                                src={getUploadUrl(player.profilePicUrl) || ''} 
                                alt={player.name}
                                className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                                onError={(e) => {
                                  // If image fails to load, hide it and show placeholder
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 ${player.profilePicUrl ? 'hidden' : ''}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {player.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
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
              <EmptyState
                icon={CalendarDaysIcon}
                title="No upcoming matches"
                description="There are no matches scheduled at the moment. Check back later!"
              />
            </Card>
          )}
          
          {/* Show more matches indicator */}
          {matches.length > 2 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing next 2 matches out of {matches.length} total
              </p>
            </div>
          )}
        </>
      )}

      {/* Availability History */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Availability History</h2>
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
                    className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(new Date(record.matchDate), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        record.isAvailable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {record.isAvailable ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
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