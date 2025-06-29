import { apiClient } from './client';

export interface PlayerStats {
  totalMatches: number;
  attendanceRate: number;
  positionsPlayed: Record<string, number>;
  teamAssignments: {
    teamA: number;
    teamB: number;
  };
}

export interface DashboardSummary {
  overview: {
    totalPlayers: number;
    activeUsers: number;
    teamsGenerated: number;
    averageAvailability: number;
  };
  topPerformers: Array<{
    name: string;
    availabilityRate: number;
    gamesPlayed: number;
  }>;
  recentTrends: AvailabilityTrend[];
  teamStats: {
    averagePlayersPerTeam: number;
    positionDistribution: Record<string, number>;
    goalkeeperCoverage: Record<string, number>;
  };
  systemHealth: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface PlayerPerformance {
  playerId: number;
  playerName: string;
  totalMatches: number;
  attendanceRate: number;
  preferredPosition: string;
  positionsPlayed: Record<string, number>;
  lastPlayed?: string;
}

export interface TeamAnalytics {
  totalTeamsGenerated: number;
  averagePlayersPerTeam: number;
  positionDistribution: Record<string, number>;
  teamBalanceScore: number;
  substituteAnalytics: {
    totalSubstitutes: number;
    averageSubstitutesPerMatch: number;
    substitutionRate: number;
  };
}

export interface SystemAnalytics {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    inactiveUsers: number;
  };
  systemHealth: {
    uptime: number;
    errorRate: number;
    averageResponseTime: number;
  };
  matchStatistics: {
    totalMatches: number;
    averagePlayersPerMatch: number;
    matchFrequency: string;
  };
}

export interface AvailabilityTrend {
  date: string;
  availableCount: number;
  totalPlayers: number;
  availabilityRate: number;
}

export const analyticsApi = {
  /**
   * Get personal player statistics
   */
  getMyStats: async (): Promise<PlayerStats> => {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats }>('/analytics/my-stats');
    return response.data.data;
  },

  /**
   * Get admin dashboard summary
   */
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardSummary }>('/analytics/dashboard');
    return response.data.data;
  },

  /**
   * Get player performance analytics
   */
  getPlayerPerformance: async (seasonYear?: number): Promise<PlayerPerformance[]> => {
    const params = seasonYear ? { seasonYear } : {};
    const response = await apiClient.get<{ success: boolean; data: { players: PlayerPerformance[] } }>('/analytics/players', { params });
    return response.data.data.players;
  },

  /**
   * Get team analytics
   */
  getTeamAnalytics: async (startDate?: string, endDate?: string): Promise<TeamAnalytics> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<{ success: boolean; data: TeamAnalytics }>('/analytics/teams', { params });
    return response.data.data;
  },

  /**
   * Get system analytics
   */
  getSystemAnalytics: async (): Promise<SystemAnalytics> => {
    const response = await apiClient.get<{ success: boolean; data: SystemAnalytics }>('/analytics/system');
    return response.data.data;
  },

  /**
   * Get availability trends
   */
  getAvailabilityTrends: async (days: number = 7): Promise<AvailabilityTrend[]> => {
    const response = await apiClient.get<{ success: boolean; data: { trends: AvailabilityTrend[] } }>('/analytics/availability-trends', {
      params: { days }
    });
    return response.data.data.trends;
  },
}; 