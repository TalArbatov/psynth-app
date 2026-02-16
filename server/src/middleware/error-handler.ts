import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    const requestId = req.requestId ?? 'unknown';

    if (err instanceof AppError) {
        logger.warn(`${err.name}: ${err.message}`, {
            requestId,
            statusCode: err.statusCode,
        });
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }

    // Unexpected error
    logger.error(`Unhandled error: ${err.message}`, {
        requestId,
        stack: err.stack,
    });
    res.status(500).json({
        error: 'Internal server error',
    });
}
