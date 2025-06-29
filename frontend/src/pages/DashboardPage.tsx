import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CollapsibleSection } from '../components/common/CollapsibleSection';
import { Skeleton, SkeletonGroup } from '../components/common/Skeleton';
import { useAuthStore } from '../stores/authStore';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { availabilityApi } from '../api/availability';
import { teamsApi } from '../api/teams';
import { CalendarIcon } from '@heroicons/react/24/outline';

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
      {/* Welcome Message */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name || 'Player'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Priority Alert - Current Team Assignment */}
      {currentTeam && (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Today's Team Assignment
              </h2>
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                {currentTeam.teamName}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Match on {format(currentTeam.matchDate, 'EEEE, MMMM d')}
              {currentTeam.isSubstitute && (
                <span className="ml-2 text-yellow-700 dark:text-yellow-400 font-medium">(Substitute)</span>
              )}
            </p>
            <Button
              onClick={() => navigate('/teams')}
              variant="primary"
            >
              View Full Teams
            </Button>
          </div>
        </Card>
      )}

      {/* Action Required - Availability Submission */}
      {(() => {
        // Find the next upcoming match that hasn't passed deadline
        const nextMatch = upcomingMatches
          .filter(m => !isDeadlinePassed(m.availabilityDeadline))
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        // Only show if the next match needs submission
        return nextMatch && nextMatch.availabilityStatus === 'not_submitted' ? (
          <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
            <div className="p-6">
              <div className="flex items-start space-x-3">
                <ExclamationCircleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Action Required</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    Submit your availability for {nextMatch.dayOfWeek}'s match on {format(nextMatch.date, 'MMM d')}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Deadline: {format(nextMatch.availabilityDeadline, 'MMM d, h:mm a')}
                  </p>
                  <Button
                    onClick={() => navigate('/availability')}
                    variant="primary"
                    size="sm"
                    className="mt-3"
                  >
                    Submit Availability
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : null;
      })()}

      {/* Quick Stats - Collapsed by default */}
      <CollapsibleSection 
        title="Your Statistics" 
        defaultOpen={false}
        badge={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {quickStats.availabilityRate}% availability rate
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.gamesThisMonth}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Games This Month</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.upcomingGames}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Upcoming Games</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.availabilityRate}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Availability Rate</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Upcoming Matches - Show first 2, rest collapsible */}
      <CollapsibleSection 
        title="Upcoming Matches" 
        defaultOpen={true}
        badge={
          upcomingMatches.length > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              {upcomingMatches.length} matches
            </span>
          )
        }
      >
        <div className="space-y-3 mt-4">
          {upcomingMatches.map((match, index) => (
            <div
              key={index}
              className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {match.dayOfWeek} Football
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {format(match.date, 'MMMM d, yyyy')}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      {getAvailabilityStatusIcon(match.availabilityStatus)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {getAvailabilityStatusText(match.availabilityStatus)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {match.availablePlayersCount} players confirmed
                    </span>
                  </div>
                </div>
                <div>
                  {!isDeadlinePassed(match.availabilityDeadline) && match.availabilityStatus === 'not_submitted' && (
                    <Button
                      onClick={() => navigate('/availability')}
                      variant="primary"
                      size="sm"
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {upcomingMatches.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming matches scheduled</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Profile Completion Reminder - Only if needed */}
      {user && (!user.profilePicUrl || !user.preferredPosition || user.preferredPosition === 'any') && (
        <CollapsibleSection 
          title="Complete Your Profile" 
          defaultOpen={true}
          badge={
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
              Incomplete
            </span>
          }
        >
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Complete your profile to help with better team organization:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
              {!user.profilePicUrl && (
                <li className="flex items-center space-x-2">
                  <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <span>Add profile picture</span>
                </li>
              )}
              {(!user.preferredPosition || user.preferredPosition === 'any') && (
                <li className="flex items-center space-x-2">
                  <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <span>Select preferred position</span>
                </li>
              )}
            </ul>
            <Button
              onClick={() => navigate('/profile')}
              variant="secondary"
              size="sm"
            >
              Complete Profile
            </Button>
          </div>
        </CollapsibleSection>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard-stats">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Match</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {upcomingMatches[0] ? format(new Date(upcomingMatches[0].date), 'MMM d') : 'No matches'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 