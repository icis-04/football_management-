import React, { useEffect, useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { useAuthStore } from '../stores/authStore';
import { UserGroupIcon, CalendarIcon, TrophyIcon, ShareIcon } from '@heroicons/react/24/outline';

interface Player {
  id: number;
  name: string;
  position: string;
  assignedPosition?: string;
  profilePicUrl?: string;
  isSubstitute?: boolean;
  substituteForPosition?: string;
}

interface Team {
  teamNumber: number;
  teamName: string;
  players: Player[];
  substitutes: Player[];
}

interface TeamMatch {
  matchDate: Date;
  teams: Team[];
  isPublished: boolean;
  publishedAt?: Date;
}

interface HistoricalMatch {
  matchDate: Date;
  teamNumber: number;
  teamName: string;
  playersCount: number;
  wasSubstitute: boolean;
}

export const TeamsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState<TeamMatch | null>(null);
  const [upcomingMatch, setUpcomingMatch] = useState<TeamMatch | null>(null);
  const [matchHistory, setMatchHistory] = useState<HistoricalMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      
      // Mock data
      const today = new Date();
      const now = new Date();
      const isAfterNoon = now.getHours() >= 12;
      
      // Check if today is Monday or Wednesday
      const dayOfWeek = today.getDay();
      const isMatchDay = dayOfWeek === 1 || dayOfWeek === 3;
      
      if (isMatchDay && isAfterNoon) {
        // Teams are published for today
        setCurrentMatch({
          matchDate: startOfDay(today),
          isPublished: true,
          publishedAt: new Date(today.setHours(12, 0, 0, 0)),
          teams: [
            {
              teamNumber: 1,
              teamName: 'Team Red',
              players: [
                { id: 1, name: 'John Doe', position: 'goalkeeper', assignedPosition: 'goalkeeper' },
                { id: 2, name: 'Jane Smith', position: 'defender' },
                { id: 3, name: 'Mike Johnson', position: 'midfielder' },
                { id: 4, name: 'Sarah Williams', position: 'forward' },
                { id: 5, name: 'Tom Brown', position: 'defender' },
                { id: 6, name: 'Emma Davis', position: 'midfielder' },
                { id: 7, name: 'Chris Wilson', position: 'forward' },
                { id: 8, name: 'Lisa Anderson', position: 'defender' },
                { id: 9, name: 'David Martinez', position: 'midfielder' },
                { id: 10, name: 'Amy Taylor', position: 'any' },
              ],
              substitutes: [
                { 
                  id: 11, 
                  name: 'Peter Garcia', 
                  position: 'goalkeeper', 
                  isSubstitute: true,
                  substituteForPosition: 'goalkeeper'
                },
              ],
            },
            {
              teamNumber: 2,
              teamName: 'Team Blue',
              players: [
                { id: 12, name: 'Robert Lee', position: 'goalkeeper', assignedPosition: 'goalkeeper' },
                { id: 13, name: 'Maria Rodriguez', position: 'defender' },
                { id: 14, name: 'James White', position: 'midfielder' },
                { id: 15, name: 'Patricia Harris', position: 'forward' },
                { id: 16, name: 'Michael Clark', position: 'defender' },
                { id: 17, name: 'Jennifer Lewis', position: 'midfielder' },
                { id: 18, name: 'William Walker', position: 'forward' },
                { id: 19, name: 'Elizabeth Hall', position: 'defender' },
                { id: 20, name: 'Daniel Allen', position: 'midfielder' },
                { id: 21, name: 'Susan Young', position: 'any' },
              ],
              substitutes: [
                { 
                  id: 22, 
                  name: 'Kevin King', 
                  position: 'forward', 
                  isSubstitute: true,
                  substituteForPosition: 'forward'
                },
              ],
            },
          ],
        });
      } else {
        // Show next match teams if available (for preview)
        const nextMonday = getNextWeekday(today, 1);
        const nextWednesday = getNextWeekday(today, 3);
        const nextMatch = nextMonday < nextWednesday ? nextMonday : nextWednesday;
        
        setUpcomingMatch({
          matchDate: nextMatch,
          isPublished: false,
          teams: [],
        });
      }
      
      // Mock match history
      setMatchHistory([
        {
          matchDate: new Date('2025-01-13'),
          teamNumber: 1,
          teamName: 'Team Red',
          playersCount: 10,
          wasSubstitute: false,
        },
        {
          matchDate: new Date('2025-01-08'),
          teamNumber: 2,
          teamName: 'Team Blue',
          playersCount: 10,
          wasSubstitute: false,
        },
        {
          matchDate: new Date('2025-01-06'),
          teamNumber: 1,
          teamName: 'Team Red',
          playersCount: 11,
          wasSubstitute: true,
        },
        {
          matchDate: new Date('2025-01-01'),
          teamNumber: 3,
          teamName: 'Team Green',
          playersCount: 8,
          wasSubstitute: false,
        },
      ]);
    } catch (error) {
      console.error('Error fetching teams data:', error);
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

  const getTeamColor = (teamNumber: number): string => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500'];
    return colors[teamNumber - 1] || 'bg-gray-500';
  };

  const getTeamTextColor = (teamNumber: number): string => {
    const colors = ['text-red-600', 'text-blue-600', 'text-green-600'];
    return colors[teamNumber - 1] || 'text-gray-600';
  };

  const handleShareTeams = (match: TeamMatch) => {
    const teamsText = match.teams.map(team => {
      const playersList = team.players.map(p => `- ${p.name} (${p.position})`).join('\n');
      const substitutesList = team.substitutes.length > 0 
        ? '\n\nSubstitutes:\n' + team.substitutes.map(p => `- ${p.name}${p.substituteForPosition === 'goalkeeper' ? ' (GK)' : ''}`).join('\n')
        : '';
      return `${team.teamName}:\n${playersList}${substitutesList}`;
    }).join('\n\n');

    const message = `Football Teams - ${format(match.matchDate, 'EEEE, MMMM d')}\n\n${teamsText}`;

    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'Football Teams',
        text: message,
      }).catch(() => {
        // User cancelled or error occurred
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(message).then(() => {
        alert('Teams copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy teams');
      });
    }
  };

  const renderTeamCard = (team: Team) => {
    const userInTeam = team.players.find(p => p.id === user?.id);
    const userIsSubstitute = team.substitutes.find(p => p.id === user?.id);
    const isUserTeam = userInTeam || userIsSubstitute;

    return (
      <Card
        key={team.teamNumber}
        className={`${isUserTeam ? 'ring-2 ring-blue-500' : ''}`}
      >
        <div className="p-6">
          {/* Team Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${getTeamColor(team.teamNumber)}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {team.teamName}
              </h3>
              {isUserTeam && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Your Team
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {team.players.length} players
            </span>
          </div>

          {/* Players List */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Starting Players</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {team.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg ${
                      player.id === user?.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${
                        player.id === user?.id ? 'text-blue-700' : 'text-gray-900'
                      } truncate`}>
                        {player.name}
                        {player.id === user?.id && ' (You)'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {player.assignedPosition || player.position}
                        {player.position === 'goalkeeper' && ' 🥅'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Substitutes */}
            {team.substitutes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Substitutes</h4>
                <div className="space-y-2">
                  {team.substitutes.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg ${
                        player.id === user?.id ? 'bg-yellow-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${
                          player.id === user?.id ? 'text-yellow-700' : 'text-gray-700'
                        } truncate`}>
                          {player.name}
                          {player.id === user?.id && ' (You)'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Substitute
                          {player.substituteForPosition === 'goalkeeper' && ' (Goalkeeper)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
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
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <p className="text-gray-600 mt-2">
          View current teams and your match history
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Teams
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Match History
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'current' ? (
        <>
          {/* Current Match Teams */}
          {currentMatch && currentMatch.isPublished ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Teams for {format(currentMatch.matchDate, 'EEEE, MMMM d')}
                </h2>
                <div className="flex items-center space-x-4">
                  {currentMatch.publishedAt && (
                    <span className="text-sm text-gray-500">
                      Published at {format(currentMatch.publishedAt, 'h:mm a')}
                    </span>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShareTeams(currentMatch)}
                    className="flex items-center space-x-2"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentMatch.teams.map((team) => renderTeamCard(team))}
              </div>

              {/* Third Team (if exists) */}
              {currentMatch.teams.length > 2 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Additional Team
                  </h3>
                  <div className="max-w-2xl">
                    {renderTeamCard(currentMatch.teams[2])}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <div className="p-12 text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {upcomingMatch
                    ? `Teams will be published on ${format(upcomingMatch.matchDate, 'EEEE')} at 12:00 PM`
                    : 'No teams published yet'}
                </p>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Match History */}
          <div className="space-y-4">
            {matchHistory.length > 0 ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Recent Matches
                </h2>
                <div className="space-y-3">
                  {matchHistory.map((match, index) => (
                    <Card key={index}>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {format(match.matchDate, 'EEEE, MMMM d, yyyy')}
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className={`text-sm font-medium ${getTeamTextColor(match.teamNumber)}`}>
                                  {match.teamName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  • {match.playersCount} players
                                </span>
                                {match.wasSubstitute && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                    Substitute
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getTeamColor(match.teamNumber)}`} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Stats Summary */}
                <Card className="mt-6 bg-gray-50">
                  <div className="p-6">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <TrophyIcon className="w-5 h-5 text-yellow-500" />
                      <span>Your Stats</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Matches</p>
                        <p className="text-2xl font-bold text-gray-900">{matchHistory.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">As Substitute</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {matchHistory.filter(m => m.wasSubstitute).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Team Red</p>
                        <p className="text-2xl font-bold text-red-600">
                          {matchHistory.filter(m => m.teamNumber === 1).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Team Blue</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {matchHistory.filter(m => m.teamNumber === 2).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card>
                <div className="p-12 text-center">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No match history available</p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};