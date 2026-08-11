import { Router } from 'express';
import { signupHandler , loginHandler, refreshHandler } from '../controllers/user.controller';

const router = Router();

// your code - wire POST /signup to signupHandler
router.post('/signup', signupHandler);
router.post('/login' , loginHandler);
router.post('/refresh', refreshHandler);

export default router;