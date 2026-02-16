import express from 'express';
import path from 'path';
import { config } from './config';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import { sessionRouter } from './routes/session';

export function createApp(): express.Express {
    const app = express();
    const allowedOriginPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
    ];
    const staticDir = path.resolve(__dirname, '..', config.clientDir);

    // Body parsing
    app.use(express.json());

    // CORS for local client dev/preview servers.
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        const isAllowedOrigin = !!origin && allowedOriginPatterns.some((pattern) => pattern.test(origin));

        if (isAllowedOrigin && origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }

        next();
    });

    // Request logging & tracing
    app.use(requestLogger);

    // API routes
    app.use(['/session', '/session/'], sessionRouter);

    // Static files (client build)
    app.use(express.static(staticDir));

    // SPA fallback: let the client router resolve unknown non-API paths.
    app.get(/^(?!\/session(?:\/|$)).*/, (_req, res) => {
        res.sendFile(path.join(staticDir, 'index.html'));
    });

    // Error handler (must be last)
    app.use(errorHandler);

    return app;
}
