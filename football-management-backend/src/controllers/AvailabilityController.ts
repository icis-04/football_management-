import { Response } from 'express';
import { AvailabilityService } from '../services/AvailabilityService';
import { AuthenticatedRequest } from '../types/auth';
import { createApiResponse } from '../utils';
import { logger } from '../config/logger';

export class AvailabilityController {
  private availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  submitAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { matchDate, isAvailable } = req.body;

      // Parse match date
      const parsedDate = new Date(matchDate + 'T00:00:00.000Z');
      
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'INVALID_DATE',
            message: 'Invalid match date format',
          })
        );
        return;
      }

      const availability = await this.availabilityService.submitAvailability(
        userId,
        parsedDate,
        isAvailable
      );

      res.json(
        createApiResponse(
          true,
          { availability },
          'Availability submitted successfully'
        )
      );
    } catch (error) {
      if ((error as Error).message === 'AVAILABILITY_DEADLINE_PASSED') {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'AVAILABILITY_DEADLINE_PASSED',
            message: 'Availability submission deadline has passed',
          })
        );
        return;
      }

      logger.error('Submit availability failed', {
        error: (error as Error).message,
        userId: req.user?.userId,
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit availability',
        })
      );
    }
  };

  getMyAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const availability = await this.availabilityService.getUserAvailability(userId);

      res.json(createApiResponse(true, { availability }));
    } catch (error) {
      logger.error('Get user availability failed', {
        error: (error as Error).message,
        userId: req.user?.userId,
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get availability',
        })
      );
    }
  };

  getMatchAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      
      // Parse match date
      const parsedDate = new Date(date + 'T00:00:00.000Z');
      
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'INVALID_DATE',
            message: 'Invalid date format',
          })
        );
        return;
      }

      const availability = await this.availabilityService.getAvailabilityForMatch(parsedDate);

      res.json(createApiResponse(true, { availability }));
    } catch (error) {
      logger.error('Get match availability failed', {
        error: (error as Error).message,
        date: req.params['date'],
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get match availability',
        })
      );
    }
  };

  updateAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { date } = req.params;
      const { isAvailable } = req.body;

      // Parse match date
      const parsedDate = new Date(date + 'T00:00:00.000Z');
      
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'INVALID_DATE',
            message: 'Invalid date format',
          })
        );
        return;
      }

      const availability = await this.availabilityService.submitAvailability(
        userId,
        parsedDate,
        isAvailable
      );

      res.json(
        createApiResponse(
          true,
          { availability },
          'Availability updated successfully'
        )
      );
    } catch (error) {
      if ((error as Error).message === 'AVAILABILITY_DEADLINE_PASSED') {
        res.status(400).json(
          createApiResponse(false, undefined, undefined, {
            code: 'AVAILABILITY_DEADLINE_PASSED',
            message: 'Availability update deadline has passed',
          })
        );
        return;
      }

      logger.error('Update availability failed', {
        error: (error as Error).message,
        userId: req.user?.userId,
        date: req.params['date'],
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update availability',
        })
      );
    }
  };

  getUpcomingMatches = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const matches = this.availabilityService.getUpcomingMatches();

      res.json(createApiResponse(true, { matches }));
    } catch (error) {
      logger.error('Get upcoming matches failed', {
        error: (error as Error).message,
      });
      res.status(500).json(
        createApiResponse(false, undefined, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get upcoming matches',
        })
      );
    }
  };
} 