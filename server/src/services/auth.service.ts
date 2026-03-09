import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

const SALT_ROUNDS = 12;

export async function registerUser(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
        data: { email, passwordHash, name },
        select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = generateToken(user.id);
    return { user, token };
}

export async function loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id);
    return {
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        token,
    };
}

export async function getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true, email: true, name: true,
            sensitivityLevel: true, priorities: true, currentContext: true,
            createdAt: true,
        },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
}

export async function updateUserProfile(userId: string, data: {
    name?: string;
    sensitivityLevel?: string;
    priorities?: string[];
    currentContext?: string;
}) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.sensitivityLevel && { sensitivityLevel: data.sensitivityLevel }),
            ...(data.priorities && { priorities: JSON.stringify(data.priorities) }),
            ...(data.currentContext !== undefined && { currentContext: data.currentContext }),
        },
        select: {
            id: true, email: true, name: true,
            sensitivityLevel: true, priorities: true, currentContext: true,
        },
    });
}

function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
}
