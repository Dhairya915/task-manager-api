import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

const router = Router();

// your code: wire GET /health to getHealth
router.get('/health', getHealth);

export default router;
