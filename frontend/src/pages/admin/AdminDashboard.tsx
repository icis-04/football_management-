import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  ChartBarIcon, 
  UsersIcon,
  CalendarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

// Sub-pages
const EmailManagement: React.FC = () => {
  const [emails, setEmails] = useState<Array<{ id: number; email: string; used: boolean; addedAt: string }>>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllowedEmails();
  }, []);

  const fetchAllowedEmails = async () => {
    // TODO: Replace with actual API call
    setEmails([
      { id: 1, email: 'john.doe@example.com', used: true, addedAt: '2025-01-01' },
      { id: 2, email: 'jane.smith@example.com', used: true, addedAt: '2025-01-02' },
      { id: 3, email: 'mike.wilson@example.com', used: false, addedAt: '2025-01-10' },
    ]);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEmails(prev => [...prev, {
      id: Date.now(),
      email: newEmail,
      used: false,
      addedAt: new Date().toISOString().split('T')[0]
    }]);
    setNewEmail('');
    setLoading(false);
  };

  const handleRemoveEmail = async (id: number) => {
    if (!confirm('Are you sure you want to remove this email?')) return;
    
    // TODO: Replace with actual API call
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Allowed Email</h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Allowed Emails</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        email.used 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {email.used ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.addedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!email.used && (
                        <button
                          onClick={() => handleRemoveEmail(email.id)}
                          className="text-red-600 hover:text-red-900"
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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Array<{
    id: number;
    name: string;
    email: string;
    position: string;
    isActive: boolean;
    joinedAt: string;
    matchesPlayed: number;
  }>>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // TODO: Replace with actual API call
    setUsers([
      { id: 1, name: 'John Doe', email: 'john.doe@example.com', position: 'midfielder', isActive: true, joinedAt: '2025-01-01', matchesPlayed: 12 },
      { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', position: 'defender', isActive: true, joinedAt: '2025-01-02', matchesPlayed: 10 },
      { id: 3, name: 'Mike Wilson', email: 'mike.wilson@example.com', position: 'goalkeeper', isActive: false, joinedAt: '2025-01-05', matchesPlayed: 5 },
    ]);
  };

  const toggleUserStatus = async (userId: number) => {
    // TODO: Replace with actual API call
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
            <div className="text-sm text-gray-500">
              Total: {users.length} users
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {user.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="text-blue-600 hover:text-blue-900"
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

const TeamManagement: React.FC = () => {
  const [availablePlayers, setAvailablePlayers] = useState<number>(0);
  const [nextMatchDate, setNextMatchDate] = useState<string>('');
  const [teamsGenerated, setTeamsGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    // TODO: Replace with actual API call
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 - today.getDay() + 7) % 7 || 7));
    
    setNextMatchDate(nextMonday.toISOString().split('T')[0]);
    setAvailablePlayers(22);
    setTeamsGenerated(false);
  };

  const handleGenerateTeams = async () => {
    setGenerating(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTeamsGenerated(true);
    setGenerating(false);
  };

  const handlePublishTeams = async () => {
    if (!confirm('Are you sure you want to publish the teams? This action cannot be undone.')) return;
    
    // TODO: Replace with actual API call
    alert('Teams published successfully!');
    setTeamsGenerated(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Generation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Next Match</p>
              <p className="text-lg font-semibold text-gray-900">{nextMatchDate}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Available Players</p>
              <p className="text-lg font-semibold text-gray-900">{availablePlayers}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Teams Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {teamsGenerated ? 'Generated' : 'Not Generated'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleGenerateTeams}
              disabled={generating || availablePlayers < 18}
            >
              {generating ? 'Generating...' : 'Generate Teams'}
            </Button>
            {teamsGenerated && (
              <Button
                onClick={handlePublishTeams}
                variant="primary"
              >
                Publish Teams
              </Button>
            )}
          </div>

          {availablePlayers < 18 && (
            <p className="text-sm text-red-600 mt-2">
              Minimum 18 players required to generate teams
            </p>
          )}
        </div>
      </Card>

      {teamsGenerated && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Preview</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                This is a preview. Teams are not published yet.
              </p>
            </div>
            {/* Team preview would go here */}
            <p className="text-gray-600">Team preview implementation pending...</p>
          </div>
        </Card>
      )}
    </div>
  );
};

const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    avgAvailability: 0,
    totalMatches: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // TODO: Replace with actual API call
    setStats({
      totalPlayers: 30,
      activePlayers: 25,
      avgAvailability: 85,
      totalMatches: 48,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Players</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Players</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePlayers}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Availability</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgAvailability}%</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium text-gray-900">Teams generated for Monday match</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Team Generation</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium text-gray-900">New user registered: Mike Wilson</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">User Registration</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Email added: test@example.com</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Email Management</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const navItems = [
    { path: 'emails', label: 'Email Management', icon: EnvelopeIcon },
    { path: 'users', label: 'User Management', icon: UserGroupIcon },
    { path: 'teams', label: 'Team Management', icon: ClipboardDocumentListIcon },
    { path: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, teams, and system settings
        </p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <nav className="flex space-x-8 px-6" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route index element={<Navigate to="emails" replace />} />
        <Route path="emails" element={<EmailManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="teams" element={<TeamManagement />} />
        <Route path="analytics" element={<Analytics />} />
      </Routes>
    </div>
  );
}; 