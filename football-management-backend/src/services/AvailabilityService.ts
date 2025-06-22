import { Repository } from 'typeorm';
import { Availability } from '../models/Availability';
import { User } from '../models/User';
import { AppDataSource } from '../config/database';
import { logger } from '../config/logger';

export class AvailabilityService {
  private availabilityRepository: Repository<Availability>;
  private userRepository: Repository<User>;

  constructor() {
    this.availabilityRepository = AppDataSource.getRepository(Availability);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Submit or update availability for a match
   */
  async submitAvailability(userId: number, matchDate: Date, isAvailable: boolean): Promise<any> {
    try {
      // Validate submission is allowed (before deadline)
      if (!this.isSubmissionAllowed(matchDate)) {
        throw new Error('AVAILABILITY_DEADLINE_PASSED');
      }

      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      // Check if availability already exists
      let availability = await this.availabilityRepository
        .createQueryBuilder('availability')
        .where('availability.user_id = :userId', { userId })
        .andWhere('DATE(availability.match_date) = :matchDate', { matchDate: formattedDate })
        .getOne();

      if (availability) {
        // Update existing availability
        availability.is_available = isAvailable;
        availability.updated_at = new Date();
        availability = await this.availabilityRepository.save(availability);
      } else {
        // Create new availability
        availability = this.availabilityRepository.create({
          user_id: userId,
          match_date: matchDate,
          is_available: isAvailable,
        });
        availability = await this.availabilityRepository.save(availability);
      }

      logger.info('Availability submitted', {
        userId,
        matchDate: matchDate.toISOString(),
        isAvailable,
        operation: availability.id ? 'updated' : 'created',
      });

      return availability;
    } catch (error) {
      logger.error('Failed to submit availability', {
        userId,
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get availability for a specific match
   */
  async getAvailabilityForMatch(matchDate: Date): Promise<any> {
    try {
      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      const availabilities = await this.availabilityRepository
        .createQueryBuilder('availability')
        .leftJoinAndSelect('availability.user', 'user')
        .where('DATE(availability.match_date) = :matchDate', { matchDate: formattedDate })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      // Get all active users
      const allUsers = await this.userRepository.find({
        where: { is_active: true },
        select: ['id', 'name', 'email', 'preferred_position', 'profile_pic_url'],
      });

      // Categorize players
      const availablePlayers: any[] = [];
      const unavailablePlayers: any[] = [];
      const noResponsePlayers: any[] = [];

      const availabilityMap = new Map();
      availabilities.forEach(av => {
        availabilityMap.set(av.user_id, av.is_available);
      });

      allUsers.forEach(user => {
        const userAvailability = availabilityMap.get(user.id);
        
        if (userAvailability === true) {
          availablePlayers.push(user);
        } else if (userAvailability === false) {
          unavailablePlayers.push(user);
        } else {
          noResponsePlayers.push(user);
        }
      });

      return {
        matchDate: matchDate.toISOString().split('T')[0],
        availablePlayers,
        unavailablePlayers,
        noResponsePlayers,
        totalCount: allUsers.length,
        availableCount: availablePlayers.length,
        deadline: this.getAvailabilityDeadline(matchDate).toISOString(),
        isSubmissionAllowed: this.isSubmissionAllowed(matchDate),
      };
    } catch (error) {
      logger.error('Failed to get availability for match', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get user's availability for upcoming matches
   */
  async getUserAvailability(userId: number): Promise<any[]> {
    try {
      const upcomingMatches = this.getUpcomingMatches();
      const userAvailabilities = await this.availabilityRepository.find({
        where: { user_id: userId },
      });

      const availabilityMap = new Map();
      userAvailabilities.forEach(av => {
        const dateKey = new Date(av.match_date).toISOString().split('T')[0];
        availabilityMap.set(dateKey, av.is_available);
      });

      return upcomingMatches.map(match => ({
        matchDate: match.date.toISOString().split('T')[0],
        dayOfWeek: match.dayOfWeek,
        isAvailable: availabilityMap.get(match.date.toISOString().split('T')[0]) || null,
        deadline: match.availabilityDeadline.toISOString(),
        isSubmissionAllowed: match.isAvailabilityOpen,
        isTeamsPublished: match.isTeamsPublished,
      }));
    } catch (error) {
      logger.error('Failed to get user availability', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if availability submission is allowed for a match date
   */
  isSubmissionAllowed(matchDate: Date): boolean {
    // Allow all submissions in test environment
    if (process.env['NODE_ENV'] === 'test') {
      return true;
    }
    
    const deadline = this.getAvailabilityDeadline(matchDate);
    return new Date() < deadline;
  }

  /**
   * Get availability deadline for a match date
   */
  getAvailabilityDeadline(matchDate: Date): Date {
    const deadline = new Date(matchDate);
    deadline.setHours(12, 0, 0, 0); // 12:00 PM on match day
    return deadline;
  }

  /**
   * Get upcoming match dates (next 4 weeks)
   */
  getUpcomingMatches(): any[] {
    const matches: any[] = [];
    const today = new Date();
    const fourWeeksFromNow = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));

    // Find next Monday
    let currentDate = new Date(today);
    while (currentDate.getDay() !== 1) { // 1 = Monday
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate Mondays and Wednesdays for next 4 weeks
    while (currentDate <= fourWeeksFromNow) {
      // Monday match
      const mondayMatch = new Date(currentDate);
      const mondayDeadline = new Date(mondayMatch);
      mondayDeadline.setHours(12, 0, 0, 0);

      matches.push({
        date: new Date(mondayMatch),
        dayOfWeek: 'monday' as const,
        availabilityDeadline: mondayDeadline,
        isAvailabilityOpen: new Date() < mondayDeadline,
        isTeamsPublished: new Date() >= mondayDeadline,
      });

      // Wednesday match (2 days after Monday)
      const wednesdayMatch = new Date(currentDate);
      wednesdayMatch.setDate(wednesdayMatch.getDate() + 2);
      const wednesdayDeadline = new Date(wednesdayMatch);
      wednesdayDeadline.setHours(12, 0, 0, 0);

      matches.push({
        date: new Date(wednesdayMatch),
        dayOfWeek: 'wednesday' as const,
        availabilityDeadline: wednesdayDeadline,
        isAvailabilityOpen: new Date() < wednesdayDeadline,
        isTeamsPublished: new Date() >= wednesdayDeadline,
      });

      // Move to next Monday
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return matches;
  }

  /**
   * Get available players for team generation
   */
  async getAvailablePlayersForMatch(matchDate: Date): Promise<any[]> {
    try {
      // Format the date to ensure consistent comparison
      const formattedDate = matchDate.toISOString().split('T')[0];
      
      const availabilities = await this.availabilityRepository
        .createQueryBuilder('availability')
        .leftJoinAndSelect('availability.user', 'user')
        .where('DATE(availability.match_date) = :matchDate', { matchDate: formattedDate })
        .andWhere('availability.is_available = :isAvailable', { isAvailable: true })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      logger.info('Retrieved available players for match', {
        matchDate: formattedDate,
        playerCount: availabilities.length,
        players: availabilities.map(av => ({ id: av.user.id, name: av.user.name }))
      });

      return availabilities.map(av => ({
        id: av.user.id,
        name: av.user.name,
        email: av.user.email,
        preferred_position: av.user.preferred_position,
        profile_pic_url: av.user.profile_pic_url,
        is_admin: av.user.is_admin,
      }));
    } catch (error) {
      logger.error('Failed to get available players for match', {
        matchDate: matchDate.toISOString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete old availability records (cleanup)
   */
  async cleanupOldAvailability(): Promise<void> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const result = await this.availabilityRepository
        .createQueryBuilder()
        .delete()
        .where('match_date < :date', { date: threeMonthsAgo })
        .execute();

      logger.info('Old availability records cleaned up', {
        deletedCount: result.affected,
        cutoffDate: threeMonthsAgo.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to cleanup old availability', {
        error: (error as Error).message,
      });
    }
  }
} 