import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Football Team Management API',
    version: '1.0.0',
    description: 'A comprehensive API for managing football team organization, player availability, and automated team selection.',
    contact: {
      name: 'Football Management Team',
      email: 'support@footballmanagement.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server'
    },
    {
      url: 'https://api.footballmanagement.com/api/v1',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          name: { type: 'string', example: 'John Doe' },
          preferredPosition: { 
            type: 'string', 
            enum: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
            example: 'midfielder'
          },
          profilePicUrl: { type: 'string', nullable: true, example: '/uploads/avatar_123.jpg' },
          isAdmin: { type: 'boolean', example: false },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Team: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          matchDate: { type: 'string', format: 'date', example: '2025-01-20' },
          teamNumber: { type: 'integer', example: 1 },
          teamName: { type: 'string', example: 'Team 1' },
          isPublished: { type: 'boolean', example: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          players: {
            type: 'array',
            items: { $ref: '#/components/schemas/TeamPlayer' }
          },
          substitutes: {
            type: 'array',
            items: { $ref: '#/components/schemas/TeamPlayer' }
          }
        }
      },
      TeamPlayer: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          preferredPosition: { 
            type: 'string', 
            enum: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
            example: 'midfielder'
          },
          assignedPosition: { type: 'string', example: 'midfielder' },
          isSubstitute: { type: 'boolean', example: false },
          substituteForPosition: { type: 'string', nullable: true, example: 'goalkeeper' },
          profilePicUrl: { type: 'string', nullable: true, example: '/uploads/avatar_123.jpg' }
        }
      },
      Availability: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          matchDate: { type: 'string', format: 'date', example: '2025-01-20' },
          isAvailable: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      AllowedEmail: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'newplayer@example.com' },
          used: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      AdminAuditLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          adminId: { type: 'integer', example: 1 },
          action: { type: 'string', example: 'GENERATE_TEAMS' },
          targetType: { type: 'string', example: 'TEAM' },
          targetId: { type: 'integer', nullable: true, example: 1 },
          details: { type: 'object', example: { matchDate: '2025-01-20', playerCount: 22 } },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
              details: { type: 'object' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' }
        }
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'password', 'name', 'preferredPosition'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
          name: { type: 'string', example: 'John Doe' },
          preferredPosition: { 
            type: 'string', 
            enum: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
            example: 'midfielder'
          }
        }
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      AvailabilityRequest: {
        type: 'object',
        required: ['matchDate', 'isAvailable'],
        properties: {
          matchDate: { type: 'string', format: 'date', example: '2025-01-20' },
          isAvailable: { type: 'boolean', example: true }
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'John Doe' },
          preferredPosition: { 
            type: 'string', 
            enum: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
            example: 'midfielder'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User profile management endpoints'
    },
    {
      name: 'Availability',
      description: 'Player availability tracking endpoints'
    },
    {
      name: 'Teams',
      description: 'Team viewing and history endpoints'
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints for managing the system'
    },
    {
      name: 'Health',
      description: 'System health and monitoring endpoints'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/app.ts'
  ]
};

export const specs = swaggerJsdoc(options);
export default specs; 
  // Phase 6 - Notification endpoints
