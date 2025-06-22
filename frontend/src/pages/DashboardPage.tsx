import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

import { Skeleton, SkeletonGroup } from '../components/common/Skeleton';
import { useAuthStore } from '../stores/authStore';
import { CalendarIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { availabilityApi } from '../api/availability';
import { teamsApi } from '../api/teams';

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
      
      // Fetch upcoming matches and my availability
      const [matches, myAvailability] = await Promise.all([
        availabilityApi.getUpcomingMatches(),
        availabilityApi.getMyAvailability()
      ]);
      
      // Fetch availability count for each match
      const matchesWithCounts = await Promise.all(
        matches.slice(0, 2).map(async (match) => { // Only show first 2 matches
          const dateOnly = match.date.split('T')[0];
          
          // Find user's availability for this match
          const userAvailability = myAvailability.find(a => a.matchDate === dateOnly);
          
          // Get availability count
          let availablePlayersCount = 0;
          try {
            const matchAvailability = await availabilityApi.getMatchAvailability(dateOnly);
            availablePlayersCount = matchAvailability.totalAvailable;
          } catch (error) {
            console.error(`Error fetching availability for ${dateOnly}:`, error);
          }
          
          return {
            date: new Date(match.date),
            dayOfWeek: match.dayOfWeek,
            availabilityDeadline: new Date(match.availabilityDeadline),
            availabilityStatus: userAvailability 
              ? (userAvailability.isAvailable ? 'available' : 'not_available') as 'available' | 'not_available' | 'not_submitted'
              : 'not_submitted' as 'available' | 'not_available' | 'not_submitted',
            availablePlayersCount
          };
        })
      );
      
      setUpcomingMatches(matchesWithCounts);

      // Check for current teams
      try {
        const currentTeamData = await teamsApi.getCurrentTeams();
        if (currentTeamData) {
          // Find user's team
          const userTeam = currentTeamData.teams.find(team => 
            team.players.some(p => p.id === user?.id) || 
            team.substitutes.some(p => p.id === user?.id)
          );
          
          if (userTeam) {
            const isSubstitute = userTeam.substitutes.some(p => p.id === user?.id);
            const teammates = isSubstitute 
              ? [...userTeam.substitutes.filter(p => p.id !== user?.id)]
              : [...userTeam.players.filter(p => p.id !== user?.id)];
            
            setCurrentTeam({
              matchDate: new Date(currentTeamData.matchDate),
              teamNumber: userTeam.teamNumber,
              teamName: userTeam.teamName,
              teammates: teammates.map(p => ({
                id: p.id,
                name: p.name,
                position: p.position || 'any',
                profilePicUrl: p.profilePicUrl
              })),
              isSubstitute
            });
          }
        }
      } catch (error) {
        console.error('Error fetching current teams:', error);
      }

      // Calculate quick stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const gamesThisMonth = myAvailability.filter(a => {
        const matchDate = new Date(a.matchDate);
        return matchDate.getMonth() === currentMonth && a.isAvailable;
      }).length;
      
      const upcomingGames = matches.length;
      const totalResponded = myAvailability.length;
      const totalAvailable = myAvailability.filter(a => a.isAvailable).length;
      const availabilityRate = totalResponded > 0 
        ? Math.round((totalAvailable / totalResponded) * 100) 
        : 0;

      setQuickStats({
        gamesThisMonth,
        upcomingGames,
        availabilityRate,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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