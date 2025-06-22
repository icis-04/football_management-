import { Request } from 'express';
import { User } from '../models/User';

export interface JWTPayload {
  id: number;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
} 