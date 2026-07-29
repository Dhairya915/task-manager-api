import express, { type NextFunction, type Request, type Response } from 'express';
import healthRoute from './routes/health.route';
import type { HttpError } from './utils/HttpError';
import { logger } from './lib/logger';

const app = express();

app.use(express.json());
app.use('/api/v1', healthRoute);

app.use((err:HttpError , req:Request , res:Response , next:NextFunction) => {
    logger.error(err.message);
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        errors: [{ type: err.name, msg: err.message, path: '', location: '' }],
    })
})

export default app;
