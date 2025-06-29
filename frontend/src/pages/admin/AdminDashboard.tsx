import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { adminApi } from '../../api/admin';
import { teamsApi } from '../../api/teams';
import type { TeamMatch } from '../../api/teams';
import { analyticsApi } from '../../api/analytics';
import type { DashboardSummary, SystemAnalytics, TeamAnalytics, AvailabilityTrend } from '../../api/analytics';
import { useUIStore } from '../../stores/uiStore';

import { 
  UserGroupIcon, 
  ChartBarIcon, 
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Sub-pages
export const EmailManagement: React.FC = () => {
  const [emails, setEmails] = useState<Array<{ id: number; email: string; used: boolean; addedAt: string }>>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useUIStore();

  useEffect(() => {
    fetchAllowedEmails();
  }, []);

  const fetchAllowedEmails = async () => {
    try {
      const response = await adminApi.getAllowedEmails();
      // Transform the response to match our expected format
      setEmails(response.map(email => ({
        id: email.id,
        email: email.email,
        used: email.used,
        addedAt: new Date(email.created_at).toLocaleDateString()
      })));
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to fetch allowed emails'
      });
      console.error('Failed to fetch allowed emails:', error);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    try {
      const response = await adminApi.addAllowedEmail(newEmail);
      // Add the new email to the list
      setEmails(prev => [...prev, {
        id: response.id,
        email: response.email,
        used: response.used,
        addedAt: new Date(response.created_at).toLocaleDateString()
      }]);
      setNewEmail('');
      showNotification({
        type: 'success',
        title: 'Email added successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to add email'
      });
      console.error('Failed to add email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmail = async (id: number) => {
    if (!confirm('Are you sure you want to remove this email?')) return;
    
    try {
      await adminApi.removeAllowedEmail(id);
      setEmails(prev => prev.filter(e => e.id !== id));
      showNotification({
        type: 'success',
        title: 'Email removed successfully'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to remove email'
      });
      console.error('Failed to remove email:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Allowed Email</h2>
          <form onSubmit={handleAddEmail} className="flex space-x-3">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Email'}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Allowed Emails</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Added On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {email.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        email.used 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {email.used ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {email.addedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!email.used && (
                        <button
                          onClick={() => handleRemoveEmail(email.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Array<{
    id: number;
    name: string;
    email: string;
    position: string;
    isActive: boolean;
    joinedAt: string;
    matchesPlayed: number;
  }>>([]);
  const { showNotification } = useUIStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      // Transform the response to match our expected format
      setUsers(response.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.preferredPosition || 'not set',
        isActive: user.isActive,
        joinedAt: user.createdAt,
        matchesPlayed: user.matchesPlayed || 0
      })));
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to fetch users'
      });
      console.error('Failed to fetch users:', error);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      await adminApi.updateUserStatus(userId, !user.isActive);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      ));
      showNotification({
        type: 'success',
        title: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to update user status'
      });
      console.error('Failed to update user status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Users</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total: {users.length} users
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {user.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const TeamManagement: React.FC = () => {
  const [teamMatch, setTeamMatch] = useState<TeamMatch | null>(null);
  const [nextMatchDate, setNextMatchDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'current' | 'history'>('current');
  const { showNotification } = useUIStore();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Calculate next match date
      const today = new Date();
      const dayOfWeek = today.getDay();
      let daysUntilNext = 0;
      
      // Find next Monday (1) or Wednesday (3)
      if (dayOfWeek <= 1) {
        daysUntilNext = 1 - dayOfWeek;
      } else if (dayOfWeek <= 3) {
        daysUntilNext = 3 - dayOfWeek;
      } else {
        daysUntilNext = 8 - dayOfWeek; // Next Monday
      }
      
      const nextMatch = new Date(today);
      nextMatch.setDate(today.getDate() + daysUntilNext);
      setNextMatchDate(nextMatch.toLocaleDateString());

      // Try to fetch teams for the next match date
      try {
        const dateStr = nextMatch.toISOString().split('T')[0];
        const matchData = await teamsApi.getTeamsForMatch(dateStr);
        setTeamMatch(matchData);
      } catch {
        // No teams generated yet, which is fine
        setTeamMatch(null);
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Failed to fetch team data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateTeams = async () => {
    if (!confirm('Are you sure you want to regenerate teams? This will override any manual adjustments.')) {
      return;
    }
    
    showNotification({
      type: 'info',
      title: 'Team regeneration is handled automatically',
      message: 'Teams are generated every Monday and Wednesday at 12 PM'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View and manage teams for upcoming matches
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Next Match</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{nextMatchDate}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('current')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'current'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Current Teams
              </button>
              <button
                onClick={() => setSelectedTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'history'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Team History
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {selectedTab === 'current' ? (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading teams...</p>
                </div>
              ) : teamMatch && teamMatch.isPublished ? (
                <div className="space-y-4">
                  {teamMatch.publishedAt && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-800 dark:text-green-400">
                        Teams published on {new Date(teamMatch.publishedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMatch.teams.map((team, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{team.teamName}</h3>
                        <div className="space-y-2">
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Starting Players</p>
                            {team.players.map((player) => (
                              <div key={player.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded mb-1">
                                <span className="text-sm font-medium dark:text-white">{player.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{player.assignedPosition || player.position}</span>
                              </div>
                            ))}
                          </div>
                          {team.substitutes && team.substitutes.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Substitutes</p>
                              {team.substitutes.map((player) => (
                                <div key={player.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded mb-1 opacity-75">
                                  <span className="text-sm font-medium dark:text-white">{player.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Sub</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={handleRegenerateTeams}
                  >
                    Regenerate Teams
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => showNotification({ type: 'info', title: 'Manual adjustments coming soon' })}
                  >
                    Make Adjustments
                  </Button>
                </div>
              </div>
              ) : teamMatch && !teamMatch.isPublished ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Teams have been generated but not published yet.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Teams will be published automatically at 12 PM on match day
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => showNotification({ type: 'info', title: 'Publishing functionality requires backend integration' })}
                    className="mt-4"
                  >
                    Publish Teams Now
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No teams generated yet for the next match.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Teams are automatically generated every Monday and Wednesday at 12 PM
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Team history feature coming soon</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                You'll be able to view past team compositions and performance metrics
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Information Card */}
      <Card>
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">How Team Generation Works</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Teams are automatically generated every Monday and Wednesday at 12:00 PM</li>
            <li>• The system balances teams based on player positions and availability</li>
            <li>• Players receive notifications when teams are published</li>
            <li>• Manual adjustments can be made after generation if needed</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [systemData, setSystemData] = useState<SystemAnalytics | null>(null);
  const [teamData, setTeamData] = useState<TeamAnalytics | null>(null);
  const [trends, setTrends] = useState<AvailabilityTrend[]>([]);
  const { showNotification } = useUIStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dashboard, system, team, availTrends] = await Promise.all([
        analyticsApi.getDashboardSummary(),
        analyticsApi.getSystemAnalytics(),
        analyticsApi.getTeamAnalytics(),
        analyticsApi.getAvailabilityTrends(7)
      ]);
      
      setDashboardData(dashboard);
      setSystemData(system);
      setTeamData(team);
      setTrends(availTrends);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to load analytics data'
      });
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemData?.userActivity.totalUsers || 0}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemData?.userActivity.activeUsers || 0}
                </p>
              </div>
              <UsersIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Teams Generated</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {teamData?.totalTeamsGenerated || 0}
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemData?.matchStatistics?.totalMatches || 0}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Availability Trends */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Availability Trends (Last 7 Days)</h3>
          {trends.length > 0 ? (
            <div className="space-y-3">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(trend.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {trend.availableCount} / {trend.totalPlayers} players
                    </span>
                    <span className={`text-sm font-semibold ${
                      trend.availabilityRate >= 0.8 ? 'text-green-600 dark:text-green-400' : 
                      trend.availabilityRate >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(trend.availabilityRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">No availability data yet</p>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Players per Team</span>
                  <span className="font-medium dark:text-white">{dashboardData.teamStats?.averagePlayersPerTeam?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Team Balance Score</span>
                  <span className="font-medium dark:text-white">{teamData?.teamBalanceScore?.toFixed(1) || 0}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Availability</span>
                  <span className="font-medium dark:text-white">{dashboardData.overview?.averageAvailability || 0}%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">System Uptime</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="font-medium dark:text-white">{dashboardData.systemHealth?.uptime?.toFixed(1) || 0}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
                  <span className="font-medium dark:text-white">{dashboardData.systemHealth?.errorRate?.toFixed(2) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                  <span className="font-medium dark:text-white">{dashboardData.systemHealth?.averageResponseTime?.toFixed(0) || 0}ms</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {dashboardData && dashboardData.topPerformers && dashboardData.topPerformers.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
            <div className="space-y-3">
              {dashboardData.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{performer.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{performer.gamesPlayed} games played</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      performer.availabilityRate >= 0.9 ? 'text-green-600 dark:text-green-400' : 
                      performer.availabilityRate >= 0.7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(performer.availabilityRate * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">availability</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// AdminDashboard component has been replaced by AdminLayout
// The individual tab components are exported separately 