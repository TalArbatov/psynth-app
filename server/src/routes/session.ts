import { Router } from 'express';
import { sessionStore } from '../services/session-store';
import { ValidationError, NotFoundError } from '../utils/errors';

export const sessionRouter = Router();

sessionRouter.post('/', (req, res) => {
    const name = req.body?.name;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Session name is required');
    }

    const session = sessionStore.create(name.trim());
    res.status(201).json({ sessionId: session.id });
});

sessionRouter.get('/', (req, res) => {
    const name = req.query.name;
    if (!name || typeof name !== 'string') {
        throw new ValidationError('Query parameter "name" is required');
    }

    const session = sessionStore.findByName(name);
    if (!session) {
        throw new NotFoundError('Session not found');
    }

    res.json({ sessionId: session.id });
});
