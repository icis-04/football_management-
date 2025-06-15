# Football Team Management Backend Plan - Final Version

## 1. Technology Stack
- **Runtime**: Node.js (v18+) with TypeScript 5.x
- **Framework**: Express.js 4.x
- **Database**: SQLite with TypeORM
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Joi for request validation
- **File Upload**: Multer with Sharp for image processing
- **Scheduling**: node-cron
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Environment**: dotenv

## 2. Database Schema

### Tables with Indexes

#### Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL, -- bcrypt hashed
    preferred_position TEXT CHECK(preferred_position IN ('goalkeeper', 'defender', 'midfielder', 'forward', 'any')),
    profile_pic_url TEXT,
    is_admin BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

#### Allowed_Emails
```sql
CREATE TABLE allowed_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    added_by_admin_id INTEGER NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by_admin_id) REFERENCES users(id)
);
CREATE INDEX idx_allowed_emails_email ON allowed_emails(email);
```

#### Availability
```sql
CREATE TABLE availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    match_date DATE NOT NULL, -- Monday or Wednesday
    availability_type TEXT CHECK(availability_type IN ('saturday', 'sunday', 'tuesday')),
    is_available BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, match_date)
);
CREATE INDEX idx_availability_match_date ON availability(match_date);
CREATE INDEX idx_availability_user ON availability(user_id);
```

#### Teams
```sql
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_date DATE NOT NULL,
    team_number INTEGER NOT NULL CHECK(team_number IN (1, 2, 3)),
    team_name TEXT,
    is_published BOOLEAN DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_date, team_number)
);
CREATE INDEX idx_teams_match_date ON teams(match_date);
```

#### Team_Players
```sql
CREATE TABLE team_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_position TEXT,
    is_substitute BOOLEAN DEFAULT 0,
    substitute_for_position TEXT, -- 'goalkeeper' if GK substitute
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(team_id, user_id)
);
CREATE INDEX idx_team_players_team ON team_players(team_id);
```

#### Admin_Audit_Log
```sql
CREATE TABLE admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);
CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at);
```

## 3. API Endpoints Structure

### Base URL: `/api/v1`

### Authentication (`/auth`)
```typescript
POST   /auth/signup          // Body: { email, password, name, preferredPosition }
POST   /auth/login           // Body: { email, password }
POST   /auth/refresh         // Body: { refreshToken }
POST   /auth/logout          // Headers: Authorization
GET    /auth/verify-email    // Query: { email } - Check if email is allowed
```

### User Profile (`/users`)
```typescript
GET    /users/me             // Get current user profile
PUT    /users/me             // Update profile (name, preferredPosition)
POST   /users/me/avatar      // Upload avatar (multipart/form-data)
DELETE /users/me/avatar      // Remove avatar
GET    /users/players        // List all active players (non-admin view)
```

### Availability (`/availability`)
```typescript
POST   /availability         // Body: { matchDate, isAvailable }
GET    /availability/my      // Get my availability for upcoming matches
GET    /availability/match/:date  // Get all players' availability for a match
PUT    /availability/:matchDate   // Update availability (before cutoff)
```

### Teams (`/teams`)
```typescript
GET    /teams/current        // Get current week's teams (after 12pm)
GET    /teams/match/:date    // Get teams for specific match
GET    /teams/my-history     // Get user's team history

// Team Response Format
{
  "matchDate": "2025-01-20",
  "teams": [{
    "teamNumber": 1,
    "teamName": "Team 1",
    "players": [{
      "id": 1,
      "name": "John Doe",
      "position": "midfielder",
      "assignedPosition": "midfielder",
      "profilePicUrl": "/uploads/avatar1.jpg"
    }],
    "substitutes": [{
      "id": 5,
      "name": "Mike Smith",
      "position": "goalkeeper",
      "substituteFor": "goalkeeper",
      "profilePicUrl": "/uploads/avatar5.jpg"
    }]
  }]
}
```

### Admin (`/admin`)
```typescript
// Email Management
POST   /admin/allowed-emails      // Body: { email }
GET    /admin/allowed-emails      // List all with usage status
DELETE /admin/allowed-emails/:id  // Remove allowed email

// User Management  
GET    /admin/users               // List all users with filters
PUT    /admin/users/:id/status    // Activate/deactivate user
DELETE /admin/users/:id           // Permanently delete user

// Team Management
GET    /admin/teams/preview       // Preview teams before publication
POST   /admin/teams/generate      // Force generate teams
POST   /admin/teams/publish       // Publish teams
PUT    /admin/teams/:id/players   // Modify team composition

// Analytics
GET    /admin/analytics/availability   // Availability trends
GET    /admin/analytics/participation  // Player participation stats
GET    /admin/audit-log              // Admin action history
```

## 4. Core Services Architecture

### AuthService
```typescript
interface AuthService {
  signup(email: string, password: string, userData: UserData): Promise<User>
  login(email: string, password: string): Promise<AuthTokens>
  refreshToken(refreshToken: string): Promise<AuthTokens>
  logout(userId: number): Promise<void>
  validateAllowedEmail(email: string): Promise<boolean>
}
```

### AvailabilityService
```typescript
interface AvailabilityService {
  submitAvailability(userId: number, matchDate: Date, isAvailable: boolean): Promise<void>
  getAvailabilityForMatch(matchDate: Date): Promise<AvailabilityReport>
  isSubmissionAllowed(matchDate: Date): boolean
  getAvailabilityDeadline(matchDate: Date): Date
  getUpcomingMatches(): Promise<MatchDate[]>
}
```

### TeamGenerationService
```typescript
interface TeamGenerationService {
  generateTeams(matchDate: Date): Promise<Team[]>
  validateTeamComposition(teams: Team[]): ValidationResult
  assignPositions(team: Team): void
  distributeGoalkeepers(players: Player[], teamCount: number): GoalkeeperDistribution
  handleEdgeCases(availablePlayers: Player[]): TeamConfiguration
}

// Enhanced Team Generation Algorithm
function generateTeams(players: Player[]): TeamResult {
  const playerCount = players.length
  const goalkeepers = players.filter(p => p.preferred_position === 'goalkeeper')
  const fieldPlayers = players.filter(p => p.preferred_position !== 'goalkeeper')
  
  if (playerCount < 18) {
    return { teams: [], error: 'INSUFFICIENT_PLAYERS' }
  }
  
  let teamConfig: TeamConfig
  
  if (playerCount <= 19) {
    teamConfig = { teamCount: 2, playersPerTeam: 9 }
  } else if (playerCount >= 20 && playerCount < 25) {
    teamConfig = { teamCount: 2, playersPerTeam: 10 }
  } else {
    teamConfig = { teamCount: 3, playersPerTeam: 10 }
  }
  
  return distributePlayersWithGoalkeeperRule(players, goalkeepers, teamConfig)
}

// Goalkeeper Distribution Algorithm
function distributePlayersWithGoalkeeperRule(
  allPlayers: Player[], 
  goalkeepers: Player[], 
  config: TeamConfig
): TeamResult {
  const teams: Team[] = Array(config.teamCount).fill(null).map(() => ({
    players: [],
    substitutes: []
  }))
  
  // Step 1: Assign one goalkeeper per team (if available)
  const shuffledGKs = shuffle([...goalkeepers])
  const teamGKs = shuffledGKs.slice(0, config.teamCount)
  const substituteGKs = shuffledGKs.slice(config.teamCount)
  
  // Assign primary goalkeepers
  teamGKs.forEach((gk, index) => {
    teams[index].players.push({
      ...gk,
      assignedPosition: 'goalkeeper',
      isSubstitute: false
    })
  })
  
  // Step 2: Remove assigned goalkeepers from player pool
  const remainingPlayers = allPlayers.filter(
    p => !teamGKs.includes(p)
  )
  
  // Step 3: Shuffle and distribute remaining players
  const shuffledRemaining = shuffle(remainingPlayers)
  let playerIndex = 0
  
  // Fill teams to required size
  for (let teamIdx = 0; teamIdx < config.teamCount; teamIdx++) {
    const currentTeamSize = teams[teamIdx].players.length
    const playersNeeded = config.playersPerTeam - currentTeamSize
    
    for (let i = 0; i < playersNeeded && playerIndex < shuffledRemaining.length; i++) {
      teams[teamIdx].players.push({
        ...shuffledRemaining[playerIndex],
        isSubstitute: false
      })
      playerIndex++
    }
  }
  
  // Step 4: Handle remaining players as substitutes
  while (playerIndex < shuffledRemaining.length) {
    const player = shuffledRemaining[playerIndex]
    const teamIndex = playerIndex % config.teamCount
    
    teams[teamIndex].substitutes.push({
      ...player,
      isSubstitute: true,
      substituteForPosition: player.preferred_position
    })
    playerIndex++
  }
  
  // Step 5: Distribute substitute goalkeepers
  substituteGKs.forEach((gk, index) => {
    const teamIndex = index % config.teamCount
    teams[teamIndex].substitutes.push({
      ...gk,
      isSubstitute: true,
      substituteForPosition: 'goalkeeper'
    })
  })
  
  return { teams, error: null }
}

// Fisher-Yates shuffle for fairness
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
```

### NotificationService (Optional Enhancement)
```typescript
interface NotificationService {
  notifyTeamSelection(matchDate: Date): Promise<void>
  sendAvailabilityReminder(matchDate: Date): Promise<void>
  notifyAdminLowAvailability(matchDate: Date, count: number): Promise<void>
}
```

## 5. Middleware Stack

```typescript
// Applied in order:
1. helmet() - Security headers
2. cors(corsOptions) - CORS configuration
3. morgan('combined') - HTTP logging
4. express.json() - JSON body parser
5. rateLimiter - Rate limiting (stricter on auth routes)
6. authenticate - JWT validation (except public routes)
7. validateRequest - Joi schema validation
8. errorHandler - Global error handling
```

## 6. Scheduled Jobs

```typescript
// Using node-cron
const scheduledJobs = {
  // Generate teams at 12:00 PM on Mondays
  mondayTeamGeneration: '0 12 * * 1',
  
  // Generate teams at 12:00 PM on Wednesdays  
  wednesdayTeamGeneration: '0 12 * * 3',
  
  // Send availability reminder at 6:00 PM day before
  availabilityReminder: '0 18 * * 0,2', // Sunday & Tuesday
  
  // Clean up old data monthly
  dataCleanup: '0 0 1 * *'
}
```

## 7. Business Logic Rules

### Availability Rules
1. **Monday matches**: Availability window opens Saturday 00:00, closes Monday 12:00
2. **Wednesday matches**: Availability window opens Tuesday 00:00, closes Wednesday 12:00
3. Users can update availability until cutoff time
4. Default availability is `false` if not specified

### Team Selection Rules
1. **Minimum players**: 18 (2 teams of 9)
2. **Goalkeeper distribution**: Max 1 goalkeeper per team
3. **Random selection**: Use Fisher-Yates shuffle for fairness
4. **Substitute handling**: 
   - 20-24 players: Extra players are substitutes
   - 25+ players: Form 3 teams
5. **Publication**: Exactly at 12:00 PM on match day

### Admin Privileges
1. Can view real-time availability
2. Can manually trigger team generation
3. Can modify teams before publication
4. All actions are logged for audit

## 8. Error Handling Strategy

### Standard Error Response Format
```typescript
{
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    details: {}, // Optional additional info
    timestamp: '2024-01-01T12:00:00Z'
  }
}
```

### Error Codes
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_EMAIL_NOT_ALLOWED`
- `AUTH_TOKEN_EXPIRED`
- `AVAILABILITY_DEADLINE_PASSED`
- `TEAM_NOT_PUBLISHED`
- `TEAM_INSUFFICIENT_PLAYERS`
- `VALIDATION_ERROR`
- `RESOURCE_NOT_FOUND`
- `PERMISSION_DENIED`

## 9. Security Implementation

1. **Authentication**:
   - JWT with 15min access token, 7 day refresh token
   - Refresh tokens stored in httpOnly cookies
   - Token rotation on refresh

2. **Authorization**:
   - Role-based access control (User/Admin)
   - Resource-level permissions

3. **Data Protection**:
   - bcrypt with 10 rounds for passwords
   - Input sanitization with Joi
   - SQL injection prevention via TypeORM
   - XSS protection via helmet

4. **File Upload**:
   - Max 5MB file size
   - Only JPEG/PNG allowed
   - Images resized to max 500x500
   - Stored with UUID filenames

## 10. Development & Deployment

### Project Structure
```
src/
├── config/         # Configuration files
├── controllers/    # Route handlers
├── services/       # Business logic
├── models/         # TypeORM entities
├── middlewares/    # Express middlewares
├── routes/         # Route definitions
├── utils/          # Helper functions
├── validators/     # Joi schemas
├── jobs/           # Scheduled tasks
├── types/          # TypeScript types
└── app.ts          # Application entry point
```

### Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/football.db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:3001
```

### Testing Strategy
1. Unit tests for services and utilities
2. Integration tests for API endpoints
3. Mock database for testing
4. Minimum 80% code coverage

### API Documentation
- Swagger UI at `/api-docs`
- Postman collection export
- README with setup instructions

## 11. Future Enhancements
1. Email notifications via SendGrid/AWS SES
2. Match results and statistics tracking
3. Player performance analytics
4. Mobile push notifications
5. Team chat functionality
6. Automated team balancing based on skill levels