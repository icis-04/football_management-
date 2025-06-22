import { Request } from 'express';

// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  preferred_position: PlayerPosition;
  profile_pic_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  preferred_position: PlayerPosition;
  profile_pic_url?: string;
  is_admin: boolean;
  created_at: Date;
}

export type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any';

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// Availability Types
export interface Availability {
  id: number;
  user_id: number;
  match_date: Date;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AvailabilitySubmission {
  matchDate: string;
  isAvailable: boolean;
}

export interface AvailabilityReport {
  matchDate: string;
  availablePlayers: UserProfile[];
  unavailablePlayers: UserProfile[];
  noResponsePlayers: UserProfile[];
  totalCount: number;
  availableCount: number;
}

// Team Types
export interface Team {
  id: number;
  match_date: Date;
  team_number: number;
  team_name?: string;
  is_published: boolean;
  published_at?: Date;
  created_at: Date;
}

export interface TeamPlayer {
  id: number;
  team_id: number;
  user_id: number;
  assigned_position?: string;
  is_substitute: boolean;
  substitute_for_position?: string;
}

export interface TeamWithPlayers {
  teamNumber: number;
  teamName?: string;
  players: PlayerInTeam[];
  substitutes: PlayerInTeam[];
}

export interface PlayerInTeam {
  id: number;
  name: string;
  position: PlayerPosition;
  assignedPosition?: string;
  profilePicUrl?: string;
  isSubstitute: boolean;
  substituteFor?: string;
}

export interface TeamsResponse {
  matchDate: string;
  teams: TeamWithPlayers[];
  isPublished: boolean;
  publishedAt?: string;
}

// Team Generation Types
export interface TeamConfig {
  teamCount: number;
  playersPerTeam: number;
}

export interface TeamResult {
  teams: GeneratedTeam[];
  error?: string;
}

export interface GeneratedTeam {
  players: PlayerInTeam[];
  substitutes: PlayerInTeam[];
}

export interface GoalkeeperDistribution {
  teamGoalkeepers: User[];
  substituteGoalkeepers: User[];
}

// Admin Types
export interface AllowedEmail {
  id: number;
  email: string;
  added_by_admin_id: number;
  used: boolean;
  created_at: Date;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  action: string;
  target_type?: string;
  target_id?: number;
  details?: string;
  created_at: Date;
}

export interface AdminAnalytics {
  availabilityTrends: AvailabilityTrend[];
  participationStats: ParticipationStat[];
  totalPlayers: number;
  activePlayersThisMonth: number;
  averagePlayersPerMatch: number;
}

export interface AvailabilityTrend {
  date: string;
  availableCount: number;
  totalPlayers: number;
  percentage: number;
}

export interface ParticipationStat {
  playerId: number;
  playerName: string;
  matchesPlayed: number;
  matchesAvailable: number;
  participationRate: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// File Upload Types
export interface FileUploadResult {
  filename: string;
  originalName: string;
  size: number;
  url: string;
}

// Match Types
export interface MatchDate {
  date: Date;
  dayOfWeek: 'monday' | 'wednesday';
  availabilityDeadline: Date;
  isAvailabilityOpen: boolean;
  isTeamsPublished: boolean;
}

// Scheduled Job Types
export interface ScheduledJobResult {
  jobName: string;
  executedAt: Date;
  success: boolean;
  message?: string;
  error?: string;
}

// Database Connection Types
export interface DatabaseConfig {
  type: 'sqlite';
  database: string;
  synchronize: boolean;
  logging: boolean;
  entities: string[];
  migrations: string[];
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_PATH: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  UPLOAD_PATH: string;
  MAX_FILE_SIZE: number;
  FRONTEND_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_AUTH_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  LOG_FILE: string;
  // Phase 6 - Email Configuration
  EMAIL_HOST?: string;
  EMAIL_PORT: number;
  EMAIL_SECURE: boolean;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_FROM?: string;} 