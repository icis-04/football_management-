import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { useAuthStore } from '../stores/authStore';
import { UserGroupIcon, CalendarIcon, TrophyIcon, ShareIcon } from '@heroicons/react/24/outline';
import { teamsApi, type TeamMatch, type TeamHistory } from '../api/teams';

export const TeamsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState<TeamMatch | null>(null);
  const [matchHistory, setMatchHistory] = useState<TeamHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current teams
      const currentTeams = await teamsApi.getCurrentTeams();
      setCurrentMatch(currentTeams);
      
      // Fetch match history
      const history = await teamsApi.getMyTeamHistory();
      setMatchHistory(history);
    } catch (error) {
      console.error('Error fetching teams data:', error);
      setError('Failed to load teams data. Please try again later.');
    } finally {
      setLoading(false);
    }
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

    const message = `Football Teams - ${format(new Date(match.matchDate), 'EEEE, MMMM d')}\n\n${teamsText}`;

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

  const renderTeamCard = (team: any) => {
    const userInTeam = team.players.find((p: any) => p.id === user?.id);
    const userIsSubstitute = team.substitutes.find((p: any) => p.id === user?.id);
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {team.teamName}
              </h3>
              {isUserTeam && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                  Your Team
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {team.players.length} players
            </span>
          </div>

          {/* Players List */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Starting Players</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {team.players.map((player: any) => (
                  <div
                    key={player.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg ${
                      player.id === user?.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${
                        player.id === user?.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                      } truncate`}>
                        {player.name}
                        {player.id === user?.id && ' (You)'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
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
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Substitutes</h4>
                <div className="space-y-2">
                  {team.substitutes.map((player: any) => (
                    <div
                      key={player.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg ${
                        player.id === user?.id ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${
                          player.id === user?.id ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-300'
                        } truncate`}>
                          {player.name}
                          {player.id === user?.id && ' (You)'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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

  if (error) {
    return (
      <Card>
        <div className="p-12 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchTeamsData} className="mt-4">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          View current teams and your match history
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Current Teams
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Teams for {format(new Date(currentMatch.matchDate), 'EEEE, MMMM d')}
                </h2>
                <div className="flex items-center space-x-4">
                  {currentMatch.publishedAt && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Published at {format(new Date(currentMatch.publishedAt), 'h:mm a')}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {currentMatch.teams.map((team) => renderTeamCard(team))}
              </div>

              {/* Third Team (if exists) */}
              {currentMatch.teams.length > 2 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                <UserGroupIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  No teams published yet. Teams will be published on match day at 12:00 PM.
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Recent Matches
                </h2>
                <div className="space-y-3">
                  {matchHistory.map((match, index) => (
                    <Card key={index}>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {format(new Date(match.matchDate), 'EEEE, MMMM d, yyyy')}
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className={`text-sm font-medium ${getTeamTextColor(match.teamNumber)}`}>
                                  {match.teamName}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  • {match.playersCount} players
                                </span>
                                {match.wasSubstitute && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
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
                <Card className="mt-6 bg-gray-50 dark:bg-gray-700/50">
                  <div className="p-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <TrophyIcon className="w-5 h-5 text-yellow-500" />
                      <span>Your Stats</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total Matches</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{matchHistory.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">As Substitute</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {matchHistory.filter(m => m.wasSubstitute).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Team Red</p>
                        <p className="text-2xl font-bold text-red-600">
                          {matchHistory.filter(m => m.teamNumber === 1).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Team Blue</p>
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
                  <CalendarIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">No match history yet</p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};