import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { getUserReflections, saveDailyReflection, generateDailyTimeline } from '../services/neuroception.service.js';
import { generateDailyInsight } from '../services/gemini.service.js';

export const insightRouter = Router();

// Get daily reflections
insightRouter.get('/reflections', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const reflections = await getUserReflections(req.userId as string);
        res.json({ success: true, reflections });
    } catch (error) {
        next(error);
    }
});

// Generate + save today's reflection
insightRouter.post('/reflections/today', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const timeline = generateDailyTimeline();
        const aiInsight = await generateDailyInsight(timeline, req.body.context);

        const reflection = await saveDailyReflection(
            req.userId as string, today,
            aiInsight.insight, aiInsight.recommendation
        );

        res.status(201).json({
            success: true,
            reflection,
            aiInsight,
        });
    } catch (error) {
        next(error);
    }
});

// Get AI insight for arbitrary timeline data
insightRouter.post('/analyze', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { timelineData, context } = req.body;
        const data = timelineData || generateDailyTimeline();
        const insight = await generateDailyInsight(data, context);
        res.json({ success: true, insight });
    } catch (error) {
        next(error);
    }
});
