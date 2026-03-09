import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { sessionRouter } from './routes/session.routes.js';
import { insightRouter } from './routes/insight.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// Security & Performance Middleware
// ===========================================

app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/v1/auth', authLimiter);

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// ===========================================
// Health Check
// ===========================================
app.get('/health', (_, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        product: 'SafeSignal',
    });
});

// ===========================================
// API v1 Routes
// ===========================================
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/insights', insightRouter);

// Legacy routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/insights', insightRouter);

// ===========================================
// Error Handling
// ===========================================
app.use(errorHandler);

// ===========================================
// Server Start
// ===========================================
app.listen(PORT, () => {
    console.log(`🛡️  SafeSignal API Server v1.0.0 running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Helmet, Rate Limiting, Compression enabled`);
});

export default app;
