import { apiClient } from './client';

export interface TeamGenerationResult {
  teams: GeneratedTeam[];
  matchDate: string;
  totalPlayers: number;
  teamConfiguration: string;
  error?: string;
}

export interface GeneratedTeam {
  teamNumber: number;
  teamName: string;
  players: TeamPlayer[];
  substitutes: TeamPlayer[];
}

export interface TeamPlayer {
  id: number;
  name: string;
  preferred_position: string;
  assigned_position?: string;
  is_substitute: boolean;
  substitute_for_position?: string;
  profile_pic_url?: string;
}

export interface TeamPreview {
  teams: GeneratedTeam[];
  matchDate: string;
}

export const adminTeamsApi = {
  /**
   * Generate teams for a specific match date
   */
  generateTeams: async (matchDate: string): Promise<TeamGenerationResult> => {
    const response = await apiClient.post<{ success: boolean; data: TeamGenerationResult }>(
      '/admin/teams/generate',
      { matchDate }
    );
    return response.data.data;
  },

  /**
   * Publish teams for a specific match date
   */
  publishTeams: async (matchDate: string): Promise<void> => {
    await apiClient.post('/admin/teams/publish', { matchDate });
  },

  /**
   * Preview teams for a specific match date (unpublished teams)
   */
  previewTeams: async (matchDate: string): Promise<TeamPreview> => {
    const response = await apiClient.get<{ success: boolean; data: TeamPreview }>(
      '/admin/teams/preview',
      { params: { matchDate } }
    );
    return response.data.data;
  },
}; 