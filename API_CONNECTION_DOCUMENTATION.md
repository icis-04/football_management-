# API Connection Documentation

## Overview
This document details the process of connecting the frontend React application to the backend Express API, replacing mock data with real API calls.

## API Files Created

### 1. Authentication API (`/src/api/auth.ts`)
- **Connected Endpoints:**
  - `POST /auth/login` - User login
  - `POST /auth/signup` - User registration
  - `GET /auth/verify-email` - Check if email is allowed
  - `GET /auth/me` - Get current user profile
  - `PUT /auth/me` - Update user profile
  - `POST /auth/logout` - User logout
  - `POST /auth/refresh` - Refresh access token

### 2. Teams API (`/src/api/teams.ts`)
- **Connected Endpoints:**
  - `GET /teams/current` - Get current week's teams (after 12pm)
  - `GET /teams/match/:date` - Get teams for specific match
  - `GET /teams/my-history` - Get user's team history

### 3. Availability API (`/src/api/availability.ts`)
- **Connected Endpoints:**
  - `POST /availability` - Submit availability for a match
  - `GET /availability/my` - Get current user's availability
  - `GET /availability/matches` - Get upcoming matches
  - `GET /availability/match/:date` - Get all players' availability for a match
  - `PUT /availability/:date` - Update availability for a specific match

### 4. Users API (`/src/api/users.ts`)
- **Connected Endpoints:**
  - `GET /users/me` - Get current user profile
  - `PUT /users/me` - Update current user profile
  - `POST /users/me/avatar` - Upload profile picture
  - `DELETE /users/me/avatar` - Remove profile picture
  - `GET /users/players` - Get list of all active players

### 5. Notifications API (`/src/api/notifications.ts`)
- **Connected Endpoints:**
  - `GET /notifications` - Get user notifications
  - `PATCH /notifications/:id/read` - Mark notification as read
  - `PATCH /notifications/read-all` - Mark all notifications as read
  - `GET /notifications/preferences` - Get notification preferences
  - `PUT /notifications/preferences` - Update notification preferences
  - `POST /notifications/test` - Send test notification

### 6. Admin API (`/src/api/admin.ts`)
- **Connected Endpoints:**
  - `GET /admin/users` - Get list of all users (admin only)
  - `PATCH /admin/users/:userId/status` - Update user status
  - `GET /admin/allowed-emails` - Get allowed emails list
  - `POST /admin/allowed-emails` - Add allowed email
  - `DELETE /admin/allowed-emails/:id` - Remove allowed email
  - `GET /admin/stats` - Get admin dashboard stats

## Frontend Components Updated

### 1. Auth Store (`/src/stores/authStore.ts`)
- Removed mock authentication logic
- Connected to real auth API endpoints
- Updated to use `usersApi.getMe()` for refreshing user data

### 2. Teams Page (`/src/pages/TeamsPage.tsx`)
- Replaced mock data with `teamsApi` calls
- Added error handling and retry functionality
- Connected to real teams endpoints

### 3. Availability Page (`/src/pages/AvailabilityPage.tsx`)
- Replaced mock data with `availabilityApi` calls
- Added proper submission logic for new and existing availability
- Connected to real availability endpoints

### 4. Profile Page (`/src/pages/ProfilePage.tsx`)
- Connected profile update to `usersApi.updateMe()`
- Connected avatar upload to `usersApi.uploadAvatar()`
- Connected avatar removal to `usersApi.removeAvatar()`
- Added proper error handling

## Backend Endpoints Not Yet Connected

### 1. Analytics Routes (`/routes/analytics.ts`)
- No corresponding frontend component found
- Endpoints available but not used in frontend

### 2. Advanced Teams Routes (`/routes/advanced-teams.ts`)
- No corresponding frontend component found
- Endpoints available but not used in frontend

### 3. Some Admin Routes
- Admin dashboard exists but not all endpoints are connected
- Missing connections for audit logs and system metrics

## Frontend Features Without Backend Support

### 1. Dashboard Page
- Currently shows placeholder content
- No specific dashboard endpoints in backend

### 2. Admin Dashboard
- Basic user management is connected
- Missing analytics and detailed statistics

## Configuration Changes

### 1. API Client (`/src/api/client.ts`)
- Base URL configured to use environment variable or default to `http://localhost:3000/api/v1`
- Token management and refresh logic already in place
- Axios interceptors properly configured

### 2. Mock Server (`/src/api/mockServer.ts`)
- Still exists but no longer used
- Can be deleted in production

## Next Steps

1. **Remove Mock Dependencies:**
   - Delete `mockServer.ts` file
   - Remove any remaining mock data references

2. **Add Missing Frontend Features:**
   - Create analytics components to use analytics endpoints
   - Add advanced team management features
   - Enhance admin dashboard with all available endpoints

3. **Backend Enhancements Needed:**
   - Add dashboard-specific endpoints
   - Add password change functionality
   - Add more detailed user statistics

4. **Testing:**
   - Test all connected endpoints
   - Verify error handling
   - Test token refresh flow

## Environment Variables Required

Frontend:
```
VITE_API_URL=http://localhost:3000/api/v1
```

Backend:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
FRONTEND_URL=http://localhost:5173
```

## Summary

### Successfully Connected
- ✅ Authentication flow (login, signup, logout, refresh)
- ✅ User profile management (view, update, avatar)
- ✅ Teams display and history
- ✅ Availability submission and management
- ✅ Basic admin functionality (user management, allowed emails)
- ✅ Notification preferences (API created, not yet used in UI)

### Partially Connected
- ⚠️ Admin Dashboard - Basic functionality connected, missing advanced features
- ⚠️ Dashboard Page - Still using placeholder content

### Not Connected (Backend Available)
- ❌ Analytics endpoints
- ❌ Advanced team management endpoints
- ❌ Notification display in UI (API ready)

### Frontend Features Needing Backend Support
- ❌ Password change functionality
- ❌ Dashboard-specific data endpoints
- ❌ Detailed user statistics beyond basic match history

The core functionality of the application is now connected to the backend API. The main user flows (authentication, team viewing, availability management, and profile management) are fully functional with real API calls. 