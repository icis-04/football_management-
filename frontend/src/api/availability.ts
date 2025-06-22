import { apiClient } from './client';

export interface AvailabilityStatus {
  matchDate: string;
  isAvailable: boolean;
  submittedAt: string;
}

export interface Match {
  id: string;
  date: string;
  dayOfWeek: 'Monday' | 'Wednesday';
  availabilityDeadline: string;
  currentAvailability?: 'available' | 'not_available' | null;
  totalAvailable: number;
  confirmedPlayers?: Array<{
    id: number;
    name: string;
    position: string;
    profilePicUrl?: string;
  }>;
}

export interface SubmitAvailabilityData {
  matchDate: string;
  isAvailable: boolean;
}

export interface UpdateAvailabilityData {
  isAvailable: boolean;
}

export const availabilityApi = {
  /**
   * Submit availability for a match
   */
  submitAvailability: async (data: SubmitAvailabilityData): Promise<AvailabilityStatus> => {
    const response = await apiClient.post<{ success: boolean; data: { availability: {
      match_date: string;
      is_available: boolean;
      created_at: string;
      user_id: number;
      id: number;
      updated_at: string;
    } } }>('/availability', data);
    // Transform backend response
    const availability = response.data.data.availability;
    return {
      matchDate: availability.match_date.split('T')[0], // Extract date part only
      isAvailable: availability.is_available,
      submittedAt: availability.created_at
    };
  },

  /**
   * Get current user's availability for upcoming matches
   */
  getMyAvailability: async (): Promise<AvailabilityStatus[]> => {
    const response = await apiClient.get<{ success: boolean; data: { availability: Array<{
      matchDate: string;
      dayOfWeek: string;
      isAvailable: boolean | null;
      deadline: string;
      isSubmissionAllowed: boolean;
      isTeamsPublished: boolean;
    }> } }>('/availability/my');
    // Transform to match expected format, filtering out null availability
    return response.data.data.availability
      .filter(item => item.isAvailable !== null)
      .map(item => ({
        matchDate: item.matchDate,
        isAvailable: item.isAvailable as boolean,
        submittedAt: new Date().toISOString() // Backend doesn't provide this, use current time as placeholder
      }));
  },

  /**
   * Get upcoming matches
   */
  getUpcomingMatches: async (): Promise<Match[]> => {
    const response = await apiClient.get<{ success: boolean; data: { matches: Array<{
      date: string;
      dayOfWeek: string;
      availabilityDeadline: string;
      isAvailabilityOpen: boolean;
      isTeamsPublished: boolean;
    }> } }>('/availability/matches');
    // Transform backend response to match frontend expectations
    return response.data.data.matches.map((match) => ({
      id: match.date, // Use date as ID since backend doesn't provide one
      date: match.date,
      dayOfWeek: match.dayOfWeek === 'monday' ? 'Monday' : 'Wednesday',
      availabilityDeadline: match.availabilityDeadline,
      totalAvailable: 0, // Backend doesn't provide this yet
      confirmedPlayers: []
    }));
  },

  /**
   * Get all players' availability for a specific match
   */
  getMatchAvailability: async (date: string): Promise<{
    matchDate: string;
    totalAvailable: number;
    availablePlayers: Array<{
      id: number;
      name: string;
      position: string;
      profilePicUrl?: string;
    }>;
  }> => {
    const response = await apiClient.get<{ success: boolean; data: { availability: {
      matchDate: string;
      availablePlayers: Array<{
        id: number;
        email: string;
        name: string;
        preferred_position: string;
        profile_pic_url?: string | null;
      }>;
      unavailablePlayers: Array<{
        id: number;
        email: string;
        name: string;
        preferred_position: string;
        profile_pic_url?: string | null;
      }>;
      noResponsePlayers: Array<{
        id: number;
        email: string;
        name: string;
        preferred_position: string;
        profile_pic_url?: string | null;
      }>;
      totalCount: number;
      availableCount: number;
      deadline: string;
      isSubmissionAllowed: boolean;
    } } }>(`/availability/match/${date}`);
    
    const availability = response.data.data.availability;
    
    // Transform the response to match frontend expectations
    return {
      matchDate: availability.matchDate,
      totalAvailable: availability.availableCount,
      availablePlayers: availability.availablePlayers.map(player => ({
        id: player.id,
        name: player.name,
        position: player.preferred_position,
        profilePicUrl: player.profile_pic_url || undefined
      }))
    };
  },

  /**
   * Update availability for a specific match date
   */
  updateAvailability: async (date: string, data: UpdateAvailabilityData): Promise<AvailabilityStatus> => {
    const response = await apiClient.put<{ success: boolean; data: { availability: {
      match_date: string;
      is_available: boolean;
      created_at: string;
      user_id: number;
      id: number;
      updated_at: string;
    } } }>(`/availability/${date}`, data);
    // Transform backend response
    const availability = response.data.data.availability;
    return {
      matchDate: availability.match_date.split('T')[0], // Extract date part only
      isAvailable: availability.is_available,
      submittedAt: availability.updated_at
    };
  },
}; 