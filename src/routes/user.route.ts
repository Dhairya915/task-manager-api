import { Router } from 'express';
import {
  signupHandler,
  loginHandler,
  refreshHandler,
} from '../controllers/user.controller';
import { loginRateLimiter } from '../middlewares/rateLimiter.middleware';
const router = Router();

// your code - wire POST /signup to signupHandler
router.post('/signup', signupHandler);
router.post('/login', loginRateLimiter, loginHandler);
router.post('/refresh', refreshHandler);

export default router;
