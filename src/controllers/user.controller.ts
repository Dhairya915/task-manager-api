import type { Request, Response } from 'express';
import { signup, login, refreshAccessToken, promoteUser } from '../services/user.service';
import { signupSchema, updateRoleSchema } from '../validators/user.validator';
import { loginSchema } from '../validators/user.validator';

export async function signupHandler(req: Request, res: Response) {
  const parsed = signupSchema.parse(req.body);
  const user = await signup(parsed.email, parsed.password);
  res.status(201).json(user);
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.parse(req.body);
  const tokens = await login(parsed.email, parsed.password);
  res.status(200).json(tokens);
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const accessToken = refreshAccessToken(refreshToken);
  res.status(200).json({ accessToken });
}

export async function promoteUserHandler(req: Request, res: Response) {
  const parsed = updateRoleSchema.parse(req.body);
  const user = await promoteUser(req.params.id as string, parsed.role);
  res.status(200).json(user);
}
