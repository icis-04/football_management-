// User related types
export interface User {
  id: number;
  email: string;
  name: string;
  preferredPosition?: Position;
  profilePicUrl?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Position = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  preferredPosition?: Position;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Availability related types
export interface Match {
  date: string; // ISO date string
  dayOfWeek: 'Monday' | 'Wednesday';
  availabilityDeadline: string; // ISO datetime string
  isAvailable?: boolean;
  availablePlayersCount?: number;
}

export interface Availability {
  id: number;
  userId: number;
  matchDate: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerAvailability {
  id: number;
  name: string;
  profilePicUrl?: string;
  preferredPosition?: Position;
  isAvailable: boolean;
}

// Team related types
export interface TeamPlayer {
  id: number;
  name: string;
  position?: Position;
  assignedPosition?: string;
  profilePicUrl?: string;
  isSubstitute?: boolean;
  substituteFor?: Position;
}

export interface Team {
  teamNumber: 1 | 2 | 3;
  teamName: string;
  players: TeamPlayer[];
  substitutes: TeamPlayer[];
}

export interface TeamData {
  matchDate: string;
  teams: Team[];
  isPublished: boolean;
  publishedAt?: string;
}

export interface TeamHistoryItem {
  matchDate: string;
  teamNumber: number;
  teamName: string;
  result?: string;
}

// Admin related types
export interface AllowedEmail {
  id: number;
  email: string;
  used: boolean;
  addedByAdminId: number;
  createdAt: string;
}

export interface AdminUser extends User {
  lastActive?: string;
  gamesPlayed?: number;
}

export interface AvailabilityStats {
  date: string;
  availableCount: number;
  totalPlayers: number;
  percentage: number;
}

export interface AuditLogEntry {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: Record<string, unknown>;
  createdAt: string;
}

// UI related types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// API related types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 