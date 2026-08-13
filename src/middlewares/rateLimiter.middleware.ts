import rateLimit from 'express-rate-limit';
import { redis } from '../lib/redis';
import RedisStore from 'rate-limit-redis';

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    errors: [
      {
        type: 'RateLimitError',
        msg: 'Too many login attempts, try again later',
        path: '',
        location: '',
      },
    ],
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(...(args as [string, ...string[]])) as any,
  }),
});
