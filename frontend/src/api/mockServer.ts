// Mock server for development - Remove when backend is ready
import type { User } from '../types';

const MOCK_USERS: User[] = [
  {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin User',
    preferredPosition: 'any',
    isAdmin: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'player@test.com',
    name: 'John Player',
    preferredPosition: 'midfielder',
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    email: 'goalkeeper@test.com',
    name: 'Mike Keeper',
    preferredPosition: 'goalkeeper',
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    email: 'forward@test.com',
    name: 'Sarah Striker',
    preferredPosition: 'forward',
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ALLOWED_EMAILS = [
  'admin@test.com', 
  'player@test.com', 
  'goalkeeper@test.com',
  'forward@test.com',
  'newplayer@test.com',
  'test@example.com'
];

// Simple password check (in real app, this would be bcrypt)
const PASSWORDS: Record<string, string> = {
  'admin@test.com': 'admin123',
  'player@test.com': 'password123',
  'goalkeeper@test.com': 'keeper123',
  'forward@test.com': 'striker123',
};

export const mockAuth = {
  login: async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user || PASSWORDS[email] !== password) {
      throw new Error('Invalid email or password');
    }
    
    return {
      user,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };
  },

  signup: async (email: string, password: string, name: string, preferredPosition: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!ALLOWED_EMAILS.includes(email)) {
      throw new Error('Email not authorized');
    }
    
    if (MOCK_USERS.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    
    const newUser: User = {
      id: MOCK_USERS.length + 1,
      email,
      name,
      preferredPosition: preferredPosition as User['preferredPosition'],
      isAdmin: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    MOCK_USERS.push(newUser);
    PASSWORDS[email] = password;
    
    return {
      user: newUser,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };
  },

  verifyEmail: async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { allowed: ALLOWED_EMAILS.includes(email) };
  },

  getMe: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Return the first user for now
    return MOCK_USERS[0];
  },
}; 