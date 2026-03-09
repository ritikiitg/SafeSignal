import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerUser, loginUser } from '../services/auth.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { getUserProfile } from '../services/auth.service.js';

export const authRouter = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);
        const result = await registerUser(email, password, name);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const result = await loginUser(email, password);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await getUserProfile(req.userId as string);
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});
