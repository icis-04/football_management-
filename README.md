# Football Team Management App

A modern web application for managing football teams, player availability, and automated team generation. Built with React, Node.js, and TypeScript.

## 🚀 Features

### For Players
- **Easy Availability Submission** - Submit availability for upcoming matches with deadline tracking
- **Team Notifications** - Get notified when teams are published
- **Profile Management** - Upload profile pictures and manage personal information
- **Match History** - View past matches and team compositions

### For Admins
- **Automated Team Generation** - Fair, balanced teams generated automatically
- **User Management** - Manage player accounts and permissions
- **Email Whitelist** - Control who can register
- **Team Templates** - Save and reuse team configurations
- **Manual Adjustments** - Fine-tune generated teams

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern styling
- **Vite** for lightning-fast development
- **Zustand** for state management
- **PWA Support** for mobile app-like experience

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** with TypeORM
- **JWT Authentication** with refresh tokens
- **Scheduled Jobs** for automated team generation
- **File Upload** with image processing

## 📁 Project Structure

```
football-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/             # API client and endpoints
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # State management
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
│
├── football-management-backend/  # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── middlewares/    # Express middlewares
│   └── data/              # SQLite database
│
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd football-app
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd football-management-backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cd football-management-backend
   cp env.example .env
   # Edit .env with your values
   ```

4. **Initialize the database**
   ```bash
   cd football-management-backend
   npm run setup
   ```

5. **Start development servers**
   ```bash
   # Backend (in one terminal)
   cd football-management-backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs

## 🌐 Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on Vercel:
```bash
cd frontend
vercel
```

### Backend (Render)
The backend is configured for deployment on Render:
1. Push to GitHub
2. Connect repository to Render
3. Deploy using `render.yaml` configuration

See `football-management-backend/RENDER-DEPLOYMENT.md` for detailed instructions.

## 🔑 Admin Account

The admin account has been set up with:
- Email: `c.iwuchukwu@yahoo.com`
- Password: `iwuchukwu`

**Important**: Change this password immediately after first login!

## 📱 Mobile Support

The app is fully responsive and includes:
- PWA support for installation
- Touch-optimized UI
- Offline capability
- Push notifications (when configured)

## 🛡 Security Features

- JWT authentication with refresh tokens
- Email whitelist for registration
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure file upload with type checking
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check the documentation in each directory
2. Review the API documentation at `/api-docs`
3. Open an issue on GitHub

---

Built with ❤️ for football enthusiasts 