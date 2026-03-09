import prisma from '../lib/prisma.js';

// ============================================================
// Neuroception State Engine
// Processes raw sensor readings and computes nervous-system state
// ============================================================

export type NeuroState = 'safe' | 'guarded' | 'overloaded';

export interface SensorInput {
    breathPace: number;      // % change (negative = shortening)
    jawTension: number;      // % increase
    postureCollapse: number; // % increase
    skinConductance: number; // % increase
    voiceStrain: number;     // 0-100 detected strain
    motionRestless: number;  // 0-100 restlessness
}

export interface StateResult {
    state: NeuroState;
    confidence: number;
    scores: {
        breath: number;
        jaw: number;
        posture: number;
        skin: number;
        voice: number;
        motion: number;
        overall: number;
    };
}

// Weighted scoring: each signal contributes differently
const WEIGHTS = {
    breath: 0.20,
    jaw: 0.18,
    posture: 0.15,
    skin: 0.20,
    voice: 0.15,
    motion: 0.12,
};

// Thresholds for state transitions
const THRESHOLDS = {
    safe: { max: 30 },
    guarded: { min: 30, max: 65 },
    overloaded: { min: 65 },
};

export function computeState(input: SensorInput): StateResult {
    // Normalize each signal to 0-100 threat score
    const scores = {
        breath: Math.min(100, Math.max(0, Math.abs(input.breathPace) * 5)),
        jaw: Math.min(100, Math.max(0, input.jawTension * 3)),
        posture: Math.min(100, Math.max(0, input.postureCollapse * 3.5)),
        skin: Math.min(100, Math.max(0, input.skinConductance * 3)),
        voice: Math.min(100, Math.max(0, input.voiceStrain)),
        motion: Math.min(100, Math.max(0, input.motionRestless)),
        overall: 0,
    };

    // Weighted overall score
    scores.overall = Math.round(
        scores.breath * WEIGHTS.breath +
        scores.jaw * WEIGHTS.jaw +
        scores.posture * WEIGHTS.posture +
        scores.skin * WEIGHTS.skin +
        scores.voice * WEIGHTS.voice +
        scores.motion * WEIGHTS.motion
    );

    // Determine state
    let state: NeuroState = 'safe';
    if (scores.overall >= THRESHOLDS.overloaded.min) {
        state = 'overloaded';
    } else if (scores.overall >= THRESHOLDS.guarded.min) {
        state = 'guarded';
    }

    // Confidence: how far into the state band we are
    let confidence = 0;
    if (state === 'safe') {
        confidence = Math.round(100 - (scores.overall / THRESHOLDS.safe.max) * 100);
    } else if (state === 'guarded') {
        const range = THRESHOLDS.guarded.max - THRESHOLDS.guarded.min;
        const pos = scores.overall - THRESHOLDS.guarded.min;
        confidence = Math.round(50 + (pos / range) * 50);
    } else {
        confidence = Math.min(99, Math.round(60 + (scores.overall - THRESHOLDS.overloaded.min) * 0.5));
    }

    return { state, confidence: Math.min(99, Math.max(50, confidence)), scores };
}

// Simulated sensor data generator (for demo mode)
export function generateSimulatedReading(bias: NeuroState = 'guarded'): SensorInput {
    const r = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

    switch (bias) {
        case 'safe':
            return {
                breathPace: r(-3, 3), jawTension: r(0, 5), postureCollapse: r(0, 3),
                skinConductance: r(0, 5), voiceStrain: r(0, 10), motionRestless: r(0, 8),
            };
        case 'overloaded':
            return {
                breathPace: r(-20, -12), jawTension: r(22, 35), postureCollapse: r(20, 30),
                skinConductance: r(25, 40), voiceStrain: r(60, 90), motionRestless: r(50, 80),
            };
        case 'guarded':
        default:
            return {
                breathPace: r(-15, -5), jawTension: r(10, 22), postureCollapse: r(8, 18),
                skinConductance: r(10, 25), voiceStrain: r(25, 55), motionRestless: r(15, 40),
            };
    }
}

// Create a session with initial reading
export async function createSession(userId: string, label?: string) {
    const session = await prisma.session.create({
        data: { userId, label, state: 'safe', confidence: 95 },
    });
    return session;
}

// Record a sensor reading to a session
export async function recordReading(sessionId: string, input: SensorInput) {
    const result = computeState(input);

    const reading = await prisma.sensorReading.create({
        data: {
            sessionId,
            breathPace: input.breathPace,
            jawTension: input.jawTension,
            postureCollapse: input.postureCollapse,
            skinConductance: input.skinConductance,
            voiceStrain: input.voiceStrain,
            motionRestless: input.motionRestless,
            computedState: result.state,
            confidence: result.confidence,
        },
    });

    // Update session state
    await prisma.session.update({
        where: { id: sessionId },
        data: { state: result.state, confidence: result.confidence },
    });

    return { reading, result };
}

// Get sessions for a user
export async function getUserSessions(userId: string, limit = 20) {
    return prisma.session.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
            _count: { select: { readings: true, interventions: true } },
        },
    });
}

// Get session with readings
export async function getSessionDetail(sessionId: string) {
    return prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            readings: { orderBy: { recordedAt: 'asc' } },
            interventions: { orderBy: { triggeredAt: 'desc' } },
        },
    });
}

// Trigger an intervention
export async function triggerIntervention(sessionId: string, userId: string, type: string, label: string, description?: string) {
    return prisma.intervention.create({
        data: { sessionId, userId, type, label, description, accepted: true },
    });
}

// Generate simulated daily timeline
export function generateDailyTimeline() {
    const periods = [
        { period: '7:30 AM', label: 'Commute', state: 'overloaded' as NeuroState, duration: 45 },
        { period: '9:00 AM', label: 'Standup Meeting', state: 'guarded' as NeuroState, duration: 30 },
        { period: '10:00 AM', label: 'Coffee Break', state: 'safe' as NeuroState, duration: 20 },
        { period: '10:30 AM', label: 'Deep Work', state: 'safe' as NeuroState, duration: 120 },
        { period: '12:30 PM', label: 'Lunch', state: 'safe' as NeuroState, duration: 45 },
        { period: '1:30 PM', label: 'Client Call', state: 'guarded' as NeuroState, duration: 60 },
        { period: '3:00 PM', label: 'Design Review', state: 'guarded' as NeuroState, duration: 45 },
        { period: '4:00 PM', label: 'Solo Focus', state: 'safe' as NeuroState, duration: 90 },
        { period: '6:00 PM', label: 'Evening Walk', state: 'safe' as NeuroState, duration: 30 },
    ];
    return periods;
}

// Save daily reflection
export async function saveDailyReflection(userId: string, date: string, insight?: string, recommendation?: string) {
    const timelineData = JSON.stringify(generateDailyTimeline());

    return prisma.dailyReflection.upsert({
        where: { userId_date: { userId, date } },
        create: {
            userId, date, timelineData,
            insight: insight || 'Crowded transit and back-to-back meetings caused the sharpest drops in your window of tolerance.',
            recommendation: recommendation || 'Leave 10 minutes earlier and enable meeting buffer mode after 11:00 AM.',
            overallState: 'guarded',
        },
        update: {
            timelineData, insight, recommendation,
        },
    });
}

// Get reflections for a user
export async function getUserReflections(userId: string, limit = 14) {
    return prisma.dailyReflection.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
    });
}
