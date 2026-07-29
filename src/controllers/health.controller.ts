import type { Request, Response } from 'express';
import { HttpError } from '../utils/HttpError';

export function getHealth(req: Request, res: Response) {
  res.status(200).json({ status: 'ok' });
}
