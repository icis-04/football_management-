# Football Team Management Backend

A robust Node.js/TypeScript backend API for managing football team organization, player availability, and automated team selection.

## Features

- User Management: Registration, authentication, and profile management
- Availability Tracking: Players can submit availability for upcoming matches
- Automated Team Generation: Fair, random team selection with goalkeeper distribution
- Admin Dashboard: Comprehensive admin tools for managing players and teams
- Scheduled Jobs: Automatic team generation at specified times
- File Upload: Profile picture management with image processing
- Rate Limiting: Protection against abuse and spam
- Comprehensive Logging: Structured logging with Winston
- Docker Support: Containerized deployment ready

## Technology Stack

- Runtime: Node.js 18+ with TypeScript 5.x
- Framework: Express.js 4.x
- Database: SQLite with TypeORM
- Authentication: JWT (access + refresh tokens)
- Validation: Joi for request validation
- File Upload: Multer with Sharp for image processing
- Scheduling: node-cron for automated tasks
- Testing: Jest + Supertest
- Documentation: Swagger/OpenAPI
- Logging: Winston
- Security: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

## Installation

### Local Development

1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd football-management-backend
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
```

3. Create necessary directories:
```bash
mkdir -p data logs uploads
```

4. Build and start the application:
```bash
npm run build
npm run dev
```

The API will be available at http://localhost:3000

### Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up -d
```

## API Documentation

### Base URL: /api/v1

### Authentication Endpoints
- POST /auth/signup - Register new user
- POST /auth/login - Authenticate user
- POST /auth/refresh - Refresh access token
- POST /auth/logout - Logout user
- GET /auth/verify-email - Check if email is allowed

### User Profile Endpoints
- GET /users/me - Get current user profile
- PUT /users/me - Update user profile
- POST /users/me/avatar - Upload profile picture
- DELETE /users/me/avatar - Remove profile picture
- GET /users/players - List all active players

### Availability Endpoints
- POST /availability - Submit availability
- GET /availability/my - Get my availability
- GET /availability/match/:date - Get match availability
- PUT /availability/:matchDate - Update availability

### Team Endpoints
- GET /teams/current - Get current week's teams
- GET /teams/match/:date - Get teams for specific match
- GET /teams/my-history - Get user's team history

### Admin Endpoints
- POST /admin/allowed-emails - Add allowed email
- GET /admin/allowed-emails - List allowed emails
- DELETE /admin/allowed-emails/:id - Remove allowed email
- GET /admin/users - List all users
- PUT /admin/users/:id/status - Update user status
- DELETE /admin/users/:id - Delete user
- GET /admin/teams/preview - Preview teams
- POST /admin/teams/generate - Generate teams
- POST /admin/teams/publish - Publish teams
- GET /admin/analytics/availability - Availability analytics
- GET /admin/analytics/participation - Participation analytics
- GET /admin/audit-log - Admin audit log

## Business Logic

### Team Generation Algorithm
1. Minimum 18 players required
2. 18-19 players: 2 teams of 9
3. 20-24 players: 2 teams of 10 (extras as substitutes)
4. 25+ players: 3 teams of 10
5. Maximum 1 goalkeeper per team
6. Random selection using Fisher-Yates shuffle
7. Teams published at 12:00 PM on match day

### Availability Windows
- Monday matches: Saturday 00:00 - Monday 12:00
- Wednesday matches: Tuesday 00:00 - Wednesday 12:00

## Testing

Run tests:
```bash
npm test
npm run test:coverage
```

## Code Quality

Linting and formatting:
```bash
npm run lint
npm run lint:fix
npm run format
```

## Security Features

- JWT authentication with refresh tokens
- Role-based access control
- bcrypt password hashing
- Rate limiting
- Input validation with Joi
- SQL injection prevention
- XSS protection
- CORS configuration

## License

MIT License 