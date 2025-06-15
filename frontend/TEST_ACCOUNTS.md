# Test Accounts for Football Team Management App

## Available Test Accounts

### Regular Player Account
- **Email:** player@test.com
- **Password:** password123
- **Role:** Regular player
- **Features:** Can submit availability, view teams, update profile

### Admin Account
- **Email:** admin@test.com
- **Password:** admin123
- **Role:** Administrator
- **Features:** All player features + admin dashboard access

### Goalkeeper Account
- **Email:** goalkeeper@test.com
- **Password:** keeper123
- **Role:** Regular player (Goalkeeper position)
- **Features:** Same as regular player, but with goalkeeper position preference

### Additional Test Player
- **Email:** forward@test.com
- **Password:** striker123
- **Role:** Regular player (Forward position)
- **Features:** Same as regular player, but with forward position preference

## Creating New Test Accounts

In development mode, you can sign up with any email ending in `@test.com`. For example:
- newplayer@test.com
- testuser@test.com
- myname@test.com

## Notes

- These accounts only work in development mode
- The mock server stores data in memory, so it resets when you restart the app
- Profile pictures and other data are not persisted between sessions
- Teams and availability are generated with mock data for testing purposes 