import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { getUserProfile, updateUserProfile } from '../services/auth.service.js';

export const userRouter = Router();

userRouter.get('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await getUserProfile(req.userId as string);
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});

userRouter.put('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await updateUserProfile(req.userId as string, req.body);
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});
