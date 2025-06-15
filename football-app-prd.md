# Product Requirements Document (PRD)
## Football Team Management App

### Version 1.0
### Date: January 2025

---

## 1. Executive Summary

### Product Overview
The Football Team Management App is a web-based platform designed to streamline the organization of regular football matches by automating player availability tracking and team selection. The app addresses the common challenge of organizing pickup football games by providing a fair, automated system for team formation.

### Problem Statement
Organizing regular football matches with varying player availability is time-consuming and often leads to:
- Unbalanced teams
- Manual tracking of who's available
- Disputes over team selection
- Last-minute scrambling to form teams
- Goalkeepers ending up on the same team

### Solution
An automated system that:
- Collects player availability in advance
- Randomly generates balanced teams
- Ensures fair distribution of players
- Publishes teams at a fixed time
- Maintains player profiles and history

### Target Users
- **Primary**: Regular football players in organized groups
- **Secondary**: Match organizers/administrators
- **Tertiary**: New players joining the group

---

## 2. Goals and Objectives

### Business Goals
1. Simplify the process of organizing bi-weekly football matches
2. Increase player participation through streamlined availability submission
3. Eliminate disputes through transparent, random team selection
4. Save organizers 2-3 hours per week on administration

### Success Metrics
- **Adoption Rate**: 80% of invited players create accounts within first month
- **Engagement**: 90% weekly availability submission rate
- **Retention**: 70% of players active after 3 months
- **Time Saved**: Reduce team organization time from 2 hours to 5 minutes
- **User Satisfaction**: 4.5/5 average rating

### Non-Goals (v1.0)
- Match result tracking
- Player performance statistics
- Payment/fee collection
- Field booking management
- Real-time chat functionality

---

## 3. User Personas

### Persona 1: The Regular Player (Primary)
**Name**: David, 28, Software Developer

**Characteristics**:
- Plays football every Monday and Wednesday
- Sometimes forgets to confirm availability
- Wants fair team selection
- Preferred position: Midfielder

**Needs**:
- Quick way to submit availability
- Notification when teams are announced
- Access to team information on mobile
- See who else is playing

**Pain Points**:
- WhatsApp groups get cluttered
- Unfair when same strong players team up
- Last-minute team changes

### Persona 2: The Administrator
**Name**: Sarah, 35, Match Organizer

**Characteristics**:
- Organizes matches for 30+ players
- Spends hours coordinating weekly
- Deals with complaints about teams
- Maintains player contact list

**Needs**:
- Automated team generation
- Real-time availability overview
- Ability to add/remove players
- Handle last-minute changes

**Pain Points**:
- Manual team selection takes time
- Tracking availability via messages
- Ensuring goalkeeper distribution
- Managing no-shows

### Persona 3: The Occasional Player
**Name**: Mike, 24, Graduate Student

**Characteristics**:
- Plays once or twice a month
- Not always sure about availability
- New to the group
- Position: Any

**Needs**:
- Easy onboarding process
- Understanding of how system works
- Flexibility to update availability
- Feel included in the group

---

## 4. User Stories

### Epic 1: User Registration and Authentication

**US-1.1**: As a new player, I want to sign up with my email so that I can access the platform
- **Acceptance Criteria**:
  - Email must be pre-approved by admin
  - Password must be at least 8 characters
  - Email verification not required in v1
  - Show error if email not in allowed list

**US-1.2**: As a player, I want to log in securely so that I can access my profile
- **Acceptance Criteria**:
  - Login with email and password
  - Session persists for 7 days
  - "Remember me" option available
  - Forgot password flow (v2)

**US-1.3**: As an admin, I want to add allowed emails so that only invited players can register
- **Acceptance Criteria**:
  - Bulk add up to 50 emails
  - See list of allowed emails
  - Track which emails have registered
  - Remove unused emails

### Epic 2: Player Profile Management

**US-2.1**: As a player, I want to complete my profile so others can identify me
- **Acceptance Criteria**:
  - Add full name (required)
  - Select preferred position
  - Upload profile picture (optional)
  - All fields editable after creation

**US-2.2**: As a player, I want to upload a profile picture so that teammates recognize me
- **Acceptance Criteria**:
  - Support JPEG/PNG up to 5MB
  - Auto-resize to 500x500px
  - Default avatar if none uploaded
  - Can delete uploaded picture

**US-2.3**: As a player, I want to specify my preferred position so teams can be better balanced
- **Acceptance Criteria**:
  - Options: Goalkeeper, Defender, Midfielder, Forward, Any
  - Can change anytime
  - Used for display only (not team selection)
  - Goalkeeper preference impacts team distribution

### Epic 3: Availability Management

**US-3.1**: As a player, I want to submit my availability for upcoming matches
- **Acceptance Criteria**:
  - See next Monday and Wednesday matches
  - Submit by clicking Yes/No/Maybe
  - Monday availability: Saturday 00:00 - Monday 12:00
  - Wednesday availability: Tuesday 00:00 - Wednesday 12:00
  - Default to "No" if not submitted

**US-3.2**: As a player, I want to update my availability before the deadline
- **Acceptance Criteria**:
  - Can change until 12:00 PM on match day
  - See countdown timer to deadline
  - Confirmation message on update
  - Cannot update after deadline

**US-3.3**: As a player, I want to see who else is available for a match
- **Acceptance Criteria**:
  - List of confirmed players
  - Count of available players
  - Updates in real-time
  - Only shows after I submit availability

**US-3.4**: As an admin, I want to see real-time availability for all players
- **Acceptance Criteria**:
  - Dashboard with availability grid
  - Filter by match date
  - See non-responders
  - Export availability list

### Epic 4: Team Generation

**US-4.1**: As a player, I want teams to be generated randomly for fairness
- **Acceptance Criteria**:
  - Teams published at exactly 12:00 PM
  - Uses random selection algorithm
  - Even distribution of players
  - No manual intervention possible

**US-4.2**: As a player, I want to see my team assignment after 12 PM on match day
- **Acceptance Criteria**:
  - Team number and color
  - List of teammates with positions
  - Clear indication if I'm a substitute
  - Mobile-friendly display

**US-4.3**: As the system, I need to generate teams based on player count rules
- **Acceptance Criteria**:
  - <18 players: No teams (insufficient)
  - 18-19 players: 2 teams of 9
  - 20-24 players: 2 teams of 10 (extras as substitutes)
  - 25+ players: 2 teams of 10, remainder in 3rd team
  - No more than 1 goalkeeper per team (strict rule)
  - If goalkeepers > teams: extras become substitutes
  - Substitutes marked with their original position

**US-4.4**: As the system, I need to handle goalkeeper distribution correctly
- **Acceptance Criteria**:
  - Maximum 1 goalkeeper per team on the field
  - If 2 teams and 3+ goalkeepers: 1 per team, rest as substitutes
  - If 3 teams and 4+ goalkeepers: max 1 per team, 4th as substitute
  - Goalkeeper substitutes can only replace goalkeepers
  - Clear indication of goalkeeper substitutes in team display

**US-4.4**: As an admin, I want to preview teams before they're published
- **Acceptance Criteria**:
  - See generated teams before 12 PM
  - Ability to regenerate if needed
  - Manual override option (future)
  - Audit log of any changes

### Epic 5: Team Display and History

**US-5.1**: As a player, I want to see current week's teams easily
- **Acceptance Criteria**:
  - Prominent display on homepage after 12 PM
  - Clear team colors/numbers
  - Highlight my name in team list
  - Show substitutes separately with their roles
  - Goalkeeper substitutes clearly marked
  - Position assignments visible for each player

**US-5.2**: As a player, I want to see my past team assignments
- **Acceptance Criteria**:
  - List last 10 matches
  - Show date, team, and result (if available)
  - Filter by month
  - Basic statistics (games played)

### Epic 6: Admin Management

**US-6.1**: As an admin, I want to add new players to the system
- **Acceptance Criteria**:
  - Add allowed emails (bulk or individual)
  - Pre-create player profiles (optional)
  - Send invitation email (future)
  - Set player as active/inactive

**US-6.2**: As an admin, I want to remove players who no longer participate
- **Acceptance Criteria**:
  - Soft delete (deactivate) players
  - Preserve historical data
  - Remove from availability options
  - Option to reactivate

**US-6.3**: As an admin, I want to manually trigger team generation if needed
- **Acceptance Criteria**:
  - Override automatic 12 PM generation
  - Only before publication time
  - Requires confirmation
  - Logged in audit trail

**US-6.4**: As an admin, I want to see system analytics
- **Acceptance Criteria**:
  - Availability trends over time
  - Most/least active players
  - No-show tracking (future)
  - Average players per match

### Epic 7: Notifications (Future Enhancement)

**US-7.1**: As a player, I want to receive reminders to submit availability
- **Acceptance Criteria**:
  - Email 24 hours before deadline
  - Push notification option
  - Opt-out available
  - Customizable timing

**US-7.2**: As a player, I want to be notified when teams are published
- **Acceptance Criteria**:
  - Immediate notification at 12 PM
  - Shows my team assignment
  - Link to full team view
  - In-app and email options

---

## 5. Functional Requirements

### 5.1 User Management
- **Registration**: Email-based with admin pre-approval
- **Authentication**: JWT-based with refresh tokens
- **Profile**: Name, position preference, avatar
- **Roles**: Admin and Regular Player

### 5.2 Availability System
- **Submission Window**: 
  - Monday matches: Saturday 00:00 - Monday 12:00
  - Wednesday matches: Tuesday 00:00 - Wednesday 12:00
- **States**: Available, Not Available, No Response (default)
- **Updates**: Allowed until deadline
- **Display**: Show count and list of available players

### 5.3 Team Generation Algorithm
```
IF players < 18:
    two teams generated
ELSE IF players <= 19:
    Create 2 teams of 9 each
ELSE IF players >= 20 AND players < 25:
    Create 2 teams of 10 each
    Remaining players are substitutes
ELSE IF players >= 25:
    Create 2 teams of 10 each
    Create 3rd team with remaining players

GOALKEEPER DISTRIBUTION RULE:
1. Identify all players with goalkeeper preference
2. Assign maximum 1 goalkeeper per team
3. If goalkeepers count > number of teams:
   - Assign 1 goalkeeper to each team
   - Remaining goalkeepers become substitutes
   - Mark as "Goalkeeper (Substitute)"
4. Goalkeeper substitutes can only replace the goalkeeper in their assigned team
5. If no goalkeepers available, proceed with normal distribution

EXAMPLE SCENARIOS:
- 2 teams, 2 goalkeepers: 1 per team
- 2 teams, 3 goalkeepers: 1 per team, 1 substitute or joins a team as a player
- 3 teams, 4 goalkeepers: 1 per team, 1 substitute or joins a team as a player 
- 2 teams, 1 goalkeeper: 1 team with goalkeeper, 1 without, a player becomes a goalkeeper
```

### 5.4 Admin Functions
- Add/remove allowed emails
- View all players and their status
- See real-time availability
- Preview teams before publication
- Manual team generation trigger
- View audit logs

---

## 6. Technical Requirements

### 6.1 Platform Requirements
- **Frontend**: React with TypeScript
- **Backend**: Node.js with TypeScript
- **Database**: SQLite
- **Hosting**: Web-based, responsive design

### 6.2 Performance Requirements
- Page load time: < 2 seconds
- Team generation: < 1 second for 50 players
- Concurrent users: Support 100 simultaneous
- Availability: 99.9% uptime

### 6.3 Security Requirements
- Encrypted passwords (bcrypt)
- Secure authentication (JWT)
- Admin action audit trail
- Input validation
- HTTPS only

### 6.4 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

---

## 7. User Interface Requirements

### 7.1 Design Principles
- **Simple**: Minimal clicks to submit availability
- **Clear**: Obvious CTAs and deadlines
- **Responsive**: Mobile-first design
- **Accessible**: WCAG 2.1 AA compliance

### 7.2 Key Screens

#### Login/Register
- Clean form with email/password
- Clear error messages
- Link to "Request Access" for new players

#### Dashboard (Player)
- Upcoming matches with availability buttons
- Current teams (if published)
- Quick stats (games played this month)
- Profile completion reminder

#### Availability Page
- Calendar view of matches
- Big Yes/No buttons
- Countdown to deadline
- List of confirmed players

#### Teams Page
- Team cards with player lists
- My team highlighted
- Substitutes clearly marked
- Share button for WhatsApp/social

#### Admin Dashboard
- Availability grid/table
- Player management section
- Team generation controls
- Analytics widgets

### 7.3 Mobile Requirements
- Touch-friendly buttons (min 44px)
- Swipe gestures for navigation
- Offline capability for viewing teams
- Push notifications (future)

---

## 8. Assumptions and Dependencies

### Assumptions
- Players have valid email addresses
- Matches always on Monday/Wednesday
- Same venue for all matches
- Players honest about availability
- Internet connectivity for team viewing

### Dependencies
- Admin available to manage the system
- Minimum 18 players in the group
- Fixed match schedule
- Email service for notifications (future)

---

## 9. Risks and Mitigation

### Risk 1: Low Adoption Rate
- **Mitigation**: Simple onboarding, admin champions

### Risk 2: Players Forgetting to Submit
- **Mitigation**: Default to "No", reminders (future)

### Risk 3: Technical Issues at 12 PM
- **Mitigation**: Robust scheduling, manual override

### Risk 4: Disputes Over Random Selection
- **Mitigation**: Transparent algorithm, audit trail

---

## 10. Success Criteria

### Launch Criteria (MVP)
- [ ] Core authentication working
- [ ] Players can submit availability
- [ ] Automatic team generation at 12 PM
- [ ] Teams visible to all players
- [ ] Admin can manage players
- [ ] Mobile responsive design

### Success Metrics (3 months post-launch)
- 80% of players registered
- 85% average availability submission rate
- <5 complaints about team selection
- 90% reduction in admin time
- 4.5/5 user satisfaction score

---

## 11. Future Enhancements (v2.0)

1. **Match Results**: Track scores and match outcomes
2. **Player Stats**: Goals, assists, attendance
3. **Skill-Based Teams**: Optional balanced team mode
4. **Payment Integration**: Track and collect match fees
5. **Field Management**: Book and manage venues
6. **Chat**: Team and group chat functionality
7. **Tournament Mode**: Organize special events
8. **API**: Third-party integrations

---

## 12. Appendices

### A. Glossary
- **Availability Window**: Time period when players can submit availability
- **Team Publication**: 12 PM on match day when teams are revealed
- **Substitute**: Player selected but exceeding team size

### B. Mockups
[Link to Figma/design files]

### C. Technical Architecture
[Reference to backend plan document]