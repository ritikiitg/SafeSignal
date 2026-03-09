import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import {
    createSession, recordReading, getUserSessions,
    getSessionDetail, generateSimulatedReading, triggerIntervention,
} from '../services/neuroception.service.js';

export const sessionRouter = Router();

// Get all sessions for the user
sessionRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const sessions = await getUserSessions(req.userId as string);
        res.json({ success: true, sessions });
    } catch (error) {
        next(error);
    }
});

// Create a new monitoring session
sessionRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const session = await createSession(req.userId as string, req.body.label);
        res.status(201).json({ success: true, session });
    } catch (error) {
        next(error);
    }
});

// Get session detail with readings
sessionRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const session = await getSessionDetail(req.params.id as string);
        res.json({ success: true, session });
    } catch (error) {
        next(error);
    }
});

// Record a sensor reading (or simulate one)
sessionRouter.post('/:id/readings', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const input = req.body.simulated
            ? generateSimulatedReading(req.body.bias || 'guarded')
            : req.body;
        const result = await recordReading(req.params.id as string, input);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// Trigger an intervention
sessionRouter.post('/:id/interventions', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { type, label, description } = req.body;
        const intervention = await triggerIntervention(req.params.id as string, req.userId as string, type, label, description);
        res.status(201).json({ success: true, intervention });
    } catch (error) {
        next(error);
    }
});

// Get simulated reading (no DB write) — for live demo
sessionRouter.get('/:id/simulate', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const bias = (req.query.bias as string) || 'guarded';
        const { computeState, generateSimulatedReading: genReading } = await import('../services/neuroception.service.js');
        const input = genReading(bias as any);
        const result = computeState(input);
        res.json({ success: true, input, ...result });
    } catch (error) {
        next(error);
    }
});
