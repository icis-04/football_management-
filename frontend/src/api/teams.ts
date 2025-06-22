import { apiClient } from './client';

export interface Player {
  id: number;
  name: string;
  position: string;
  assignedPosition?: string;
  profilePicUrl?: string;
  isSubstitute?: boolean;
  substituteForPosition?: string;
}

export interface Team {
  teamNumber: number;
  teamName: string;
  players: Player[];
  substitutes: Player[];
}

export interface TeamMatch {
  matchDate: string;
  teams: Team[];
  isPublished: boolean;
  publishedAt?: string;
}

export interface TeamHistory {
  matchDate: string;
  teamNumber: number;
  teamName: string;
  playersCount: number;
  wasSubstitute: boolean;
}

export const teamsApi = {
  /**
   * Get current week's teams (after 12pm on match day)
   */
  getCurrentTeams: async (): Promise<TeamMatch | null> => {
    const response = await apiClient.get<{ success: boolean; data: { matches: TeamMatch[] } }>('/teams/current');
    // Return the first match if available, otherwise null
    return response.data.data.matches.length > 0 ? response.data.data.matches[0] : null;
  },

  /**
   * Get teams for a specific match date
   */
  getTeamsForMatch: async (date: string): Promise<TeamMatch> => {
    const response = await apiClient.get<{ success: boolean; data: TeamMatch }>(`/teams/match/${date}`);
    return response.data.data;
  },

  /**
   * Get user's team history
   */
  getMyTeamHistory: async (): Promise<TeamHistory[]> => {
    const response = await apiClient.get<{ success: boolean; data: { history: TeamHistory[] } }>('/teams/my-history');
    return response.data.data.history || [];
  },
}; 