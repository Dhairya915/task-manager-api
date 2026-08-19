import { Router } from 'express';
import {
  signupHandler,
  loginHandler,
  refreshHandler,
  promoteUserHandler,
} from '../controllers/user.controller';
import { loginRateLimiter } from '../middlewares/rateLimiter.middleware';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
const router = Router();

// your code - wire POST /signup to signupHandler
router.post('/signup', signupHandler);
router.post('/login', loginRateLimiter, loginHandler);
router.post('/refresh', refreshHandler);
router.patch('/users/:id/role', requireAuth, requireAdmin, promoteUserHandler);

export default router;
