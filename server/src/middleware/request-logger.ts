import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';
import type { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const requestId = nanoid(10);
    req.requestId = requestId;

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';

        logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
}
