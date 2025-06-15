# Football Team Management App

A modern web application for organizing football matches with automated team selection. Built with React, TypeScript, and Tailwind CSS.

## Features

### For Players
- **Easy Availability Submission**: Submit your availability for upcoming matches with a simple Yes/No interface
- **Real-time Countdown**: See exactly how much time is left to submit your availability
- **Team Viewing**: View your team assignment after 12 PM on match day
- **Match History**: Track your participation and team assignments over time
- **Profile Management**: Upload profile picture and set your preferred position
- **Mobile-Friendly**: Fully responsive design optimized for mobile devices

### For Administrators
- **Email Management**: Control who can register by managing allowed emails
- **User Management**: Activate/deactivate players and view their statistics
- **Team Generation**: Manually generate and publish teams with proper goalkeeper distribution
- **Analytics Dashboard**: View participation trends and system statistics
- **Audit Trail**: Track all administrative actions

## Technical Features
- **Progressive Web App**: Install on mobile devices for app-like experience
- **Offline Support**: View teams even without internet connection
- **Error Handling**: Graceful error boundaries and user-friendly messages
- **Loading States**: Skeleton loaders for better perceived performance
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd football-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── api/              # API client and service modules
├── components/       # Reusable UI components
│   ├── common/      # Generic components (Button, Card, etc.)
│   ├── layout/      # Layout components (Header, Navigation)
│   ├── auth/        # Authentication components
│   ├── availability/# Availability-specific components
│   ├── teams/       # Team display components
│   └── admin/       # Admin-specific components
├── pages/           # Page components
├── stores/          # Zustand state management
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── hooks/           # Custom React hooks
```

## Key Technologies

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **React Router v6**: Client-side routing
- **date-fns**: Date manipulation utilities
- **Lucide React**: Beautiful icon set

## Team Selection Rules

The app implements specific rules for team generation:

1. **Minimum Players**: 18 players required to generate teams
2. **Team Sizes**:
   - 18-19 players: 2 teams of 9
   - 20-24 players: 2 teams of 10 (extras as substitutes)
   - 25+ players: 2 teams of 10, remainder forms 3rd team
3. **Goalkeeper Distribution**: Maximum 1 goalkeeper per team on the field
4. **Random Selection**: Fair, random team assignment using Fisher-Yates shuffle

## Deployment

### Environment Variables

```env
VITE_API_URL=https://api.yourapp.com/api/v1
```

### Deployment Checklist

- [ ] Update API URL in environment variables
- [ ] Build the production bundle
- [ ] Configure HTTPS
- [ ] Set up proper CORS headers on the backend
- [ ] Enable service worker for offline support
- [ ] Configure CDN for static assets

### Recommended Hosting

- **Vercel**: Zero-config deployment for React apps
- **Netlify**: Great for static site hosting with CI/CD
- **AWS S3 + CloudFront**: For maximum control and scalability

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by modern sports management applications
- Icons from Lucide React
- UI components styled with Tailwind CSS
