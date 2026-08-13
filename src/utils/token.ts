import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function generateAccessToken(userId: string, role: string): string {
  const token = jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  return token;
}

export function generateRefreshToken(userId: string, role: string): string {
  const token = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return token;
}
