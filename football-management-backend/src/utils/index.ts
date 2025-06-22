import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate random filename for uploads
 */
export const generateFileName = (originalName: string): string => {
  const extension = originalName.split('.').pop();
  const randomName = crypto.randomUUID();
  return `${randomName}.${extension}`;
};

/**
 * Fisher-Yates shuffle algorithm for fair team selection
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

/**
 * Get next Monday date
 */
export const getNextMonday = (fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day; // If Sunday, next day is Monday
  date.setDate(date.getDate() + daysUntilMonday);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Get next Wednesday date
 */
export const getNextWednesday = (fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const day = date.getDay();
  let daysUntilWednesday: number;
  
  if (day <= 3) {
    daysUntilWednesday = 3 - day;
  } else {
    daysUntilWednesday = 10 - day; // Next week's Wednesday
  }
  
  date.setDate(date.getDate() + daysUntilWednesday);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Get availability deadline for a match date
 */
export const getAvailabilityDeadline = (matchDate: Date): Date => {
  const deadline = new Date(matchDate);
  deadline.setHours(12, 0, 0, 0); // 12:00 PM on match day
  return deadline;
};

/**
 * Check if availability submission is allowed
 */
export const isAvailabilitySubmissionAllowed = (matchDate: Date): boolean => {
  const now = new Date();
  const deadline = getAvailabilityDeadline(matchDate);
  return now < deadline;
};

/**
 * Get availability window start time
 */
export const getAvailabilityWindowStart = (matchDate: Date): Date => {
  const windowStart = new Date(matchDate);
  const dayOfWeek = matchDate.getDay();
  
  if (dayOfWeek === 1) { // Monday
    windowStart.setDate(windowStart.getDate() - 2); // Saturday
  } else if (dayOfWeek === 3) { // Wednesday
    windowStart.setDate(windowStart.getDate() - 1); // Tuesday
  }
  
  windowStart.setHours(0, 0, 0, 0);
  return windowStart;
};

/**
 * Check if current time is team publication time (12:00 PM on match day)
 */
export const isTeamPublicationTime = (matchDate: Date): boolean => {
  const now = new Date();
  const publicationTime = new Date(matchDate);
  publicationTime.setHours(12, 0, 0, 0);
  
  return now >= publicationTime;
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0]!;
};

/**
 * Parse date string to Date object
 */
export const parseDateString = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
};

/**
 * Check if date is Monday or Wednesday
 */
export const isValidMatchDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 1 || dayOfWeek === 3; // Monday or Wednesday
};

/**
 * Get upcoming match dates (next 4 matches)
 */
export const getUpcomingMatchDates = (fromDate: Date = new Date()): Date[] => {
  const matches: Date[] = [];
  let currentDate = new Date(fromDate);
  
  while (matches.length < 4) {
    const nextMonday = getNextMonday(currentDate);
    const nextWednesday = getNextWednesday(currentDate);
    
    if (nextMonday <= nextWednesday) {
      matches.push(nextMonday);
      if (matches.length < 4) {
        matches.push(nextWednesday);
      }
      currentDate = new Date(nextWednesday);
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      matches.push(nextWednesday);
      if (matches.length < 4) {
        matches.push(nextMonday);
      }
      currentDate = new Date(nextMonday);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return matches.slice(0, 4);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Create API response object
 */
export const createApiResponse = (
  success: boolean,
  data?: any,
  message?: string,
  error?: any
): {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
} => {
  const response: any = {
    success
  };
  
  if (message) {
    response.message = message;
  }
  
  if (data !== undefined) {
    response.data = data;
  }
  
  if (error !== undefined) {
    response.error = error;
  }
  
  return response;
};

/**
 * Create error response object
 */
export const createErrorResponse = (
  code: string,
  message: string,
  details?: any
): {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
} => {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
}; 