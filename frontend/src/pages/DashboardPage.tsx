import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isAfter, startOfDay, isSameDay } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

import { Skeleton, SkeletonGroup } from '../components/common/Skeleton';
import { useAuthStore } from '../stores/authStore';
import { CalendarIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface UpcomingMatch {
  date: Date;
  dayOfWeek: 'Monday' | 'Wednesday';
  availabilityDeadline: Date;
  availabilityStatus?: 'available' | 'not_available' | 'not_submitted';
  availablePlayersCount?: number;
}

interface CurrentTeam {
  matchDate: Date;
  teamNumber: number;
  teamName: string;
  teammates: Array<{
    id: number;
    name: string;
    position: string;
    profilePicUrl?: string;
  }>;
  isSubstitute: boolean;
}

interface QuickStats {
  gamesThisMonth: number;
  upcomingGames: number;
  availabilityRate: number;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [currentTeam, setCurrentTeam] = useState<CurrentTeam | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    gamesThisMonth: 0,
    upcomingGames: 0,
    availabilityRate: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      
      // Mock data for now
      const today = new Date();
      const nextMonday = getNextWeekday(today, 1);
      const nextWednesday = getNextWeekday(today, 3);
      
      setUpcomingMatches([
        {
          date: nextMonday,
          dayOfWeek: 'Monday',
          availabilityDeadline: new Date(nextMonday.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
          availabilityStatus: 'not_submitted',
          availablePlayersCount: 12,
        },
        {
          date: nextWednesday,
          dayOfWeek: 'Wednesday',
          availabilityDeadline: new Date(nextWednesday.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day before
          availabilityStatus: 'available',
          availablePlayersCount: 18,
        },
      ]);

      // Check if teams are published (after 12 PM on match day)
      const now = new Date();
      if (isSameDay(now, nextMonday) && now.getHours() >= 12) {
        setCurrentTeam({
          matchDate: nextMonday,
          teamNumber: 1,
          teamName: 'Team 1',
          teammates: [
            { id: 1, name: 'John Doe', position: 'midfielder' },
            { id: 2, name: 'Jane Smith', position: 'defender' },
            { id: 3, name: 'Mike Johnson', position: 'forward' },
          ],
          isSubstitute: false,
        });
      }

      setQuickStats({
        gamesThisMonth: 5,
        upcomingGames: 2,
        availabilityRate: 85,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getAvailabilityStatusIcon = (status?: string) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'not_available':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const getAvailabilityStatusText = (status?: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'not_available':
        return 'Not Available';
      default:
        return 'Not Submitted';
    }
  };

  const isDeadlinePassed = (deadline: Date): boolean => {
    return isAfter(new Date(), deadline);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <Card>
          <div className="p-6">
            <Skeleton variant="text" height={32} width="60%" className="mb-2" />
            <Skeleton variant="text" height={20} width="40%" />
          </div>
        </Card>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonGroup count={3} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <Skeleton variant="text" height={16} width="50%" className="mb-2" />
                <Skeleton variant="text" height={32} width="30%" />
              </div>
            </Card>
          </SkeletonGroup>
        </div>

        {/* Upcoming Matches Skeleton */}
        <Card>
          <div className="p-6">
            <Skeleton variant="text" height={24} width="200px" className="mb-4" />
            <SkeletonGroup count={2} className="space-y-4">
              <div className="border rounded-lg p-4">
                <Skeleton variant="text" height={20} width="150px" className="mb-2" />
                <Skeleton variant="text" height={16} width="100px" />
              </div>
            </SkeletonGroup>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'Player'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your football overview for this week
        </p>
      </div>

      {/* Current Team Display (if published) */}
      {currentTeam && (
        <Card className="border-2 border-green-500 bg-green-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Today's Team Assignment
              </h2>
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                {currentTeam.teamName}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Match on {format(currentTeam.matchDate, 'EEEE, MMMM d')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Your Teammates:</h3>
                <ul className="space-y-2">
                  {currentTeam.teammates.slice(0, 5).map((teammate) => (
                    <li key={teammate.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full" />
                      <span className="text-sm">
                        {teammate.name} ({teammate.position})
                      </span>
                    </li>
                  ))}
                  {currentTeam.teammates.length > 5 && (
                    <li className="text-sm text-gray-500">
                      +{currentTeam.teammates.length - 5} more players
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  onClick={() => navigate('/teams')}
                  className="w-full md:w-auto"
                >
                  View Full Teams
                </Button>
              </div>
            </div>
            {currentTeam.isSubstitute && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  You are listed as a substitute for this match
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Games This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quickStats.gamesThisMonth}
                </p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Games</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quickStats.upcomingGames}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Availability Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quickStats.availabilityRate}%
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Matches */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Matches
          </h2>
          <div className="space-y-4">
            {upcomingMatches.map((match, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {match.dayOfWeek} Football
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(match.date, 'MMMM d, yyyy')}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        {getAvailabilityStatusIcon(match.availabilityStatus)}
                        <span className="text-sm text-gray-600">
                          {getAvailabilityStatusText(match.availabilityStatus)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {match.availablePlayersCount} players confirmed
                      </span>
                    </div>
                    {!isDeadlinePassed(match.availabilityDeadline) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Deadline: {format(match.availabilityDeadline, 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                  <div>
                    {!isDeadlinePassed(match.availabilityDeadline) ? (
                      <Button
                        onClick={() => navigate('/availability')}
                        variant={match.availabilityStatus === 'not_submitted' ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {match.availabilityStatus === 'not_submitted' 
                          ? 'Submit Availability' 
                          : 'Update Availability'}
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-500">Deadline passed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Profile Completion Reminder */}
      {user && (!user.profilePicUrl || !user.preferredPosition) && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Add your photo and preferred position to help with team organization
                </p>
              </div>
              <Button
                onClick={() => navigate('/profile')}
                variant="secondary"
                size="sm"
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}; 