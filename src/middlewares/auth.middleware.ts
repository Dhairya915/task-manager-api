import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../utils/HttpError';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')){
    throw new HttpError('Not authorized',401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new HttpError('Not authorized', 401);
  }

  try{
    const decoded = jwt.verify(token , env.JWT_ACCESS_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  }
  catch{
    throw new HttpError('Not authorized', 401);
  }
}