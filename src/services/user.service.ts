import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../repositories/user.repository';
import { HttpError } from '../utils/HttpError';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

//signup
export async function signup(email: string, password: string) {
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new HttpError('Email already in use', 409);
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const user = await createUser({ email: email, password: hashPassword });

  return { id: user.id, email: user.email, role: user.role };
}

//login
export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new HttpError('Invalid credentials', 401);
  }

  const verify = await bcrypt.compare(password, user.password);

  if (!verify) {
    throw new HttpError('Invalid credentials', 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  return { accessToken, refreshToken };
}

//refreshToken
export function refreshAccessToken(refreshToken: string): string {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      userId: string;
      role: string;
    };
    return generateAccessToken(decoded.userId, decoded.role);
  } catch {
    throw new HttpError('Invalid refresh token', 401);
  }
}
