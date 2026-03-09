import { GoogleGenAI } from '@google/genai';
import { AppError } from '../middleware/error.middleware.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.warn('⚠️ GEMINI_API_KEY not set — AI insights will use fallback responses');
}

const ai = (apiKey && apiKey !== 'your-gemini-api-key-here') ? new GoogleGenAI({ apiKey }) : null;

const MODEL_FALLBACK_CHAIN = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
];

const SYSTEM_PROMPT = `You are SafeSignal's AI wellness advisor. You analyze neuroception data—the body's pre-conscious sense of safety vs danger—and provide compassionate, confidence-based guidance.

Rules:
1. NEVER say "you are unsafe" — use "your body may be trending toward overload"
2. Be supportive, not alarming
3. Focus on actionable micro-recommendations
4. Consider the user's daily patterns
5. Return ONLY valid JSON`;

async function tryModelWithFallback(contents: string, config: { temperature: number; maxOutputTokens: number }): Promise<string> {
    if (!ai) throw new AppError('AI service not configured', 500);

    let lastError: Error | null = null;
    for (const model of MODEL_FALLBACK_CHAIN) {
        try {
            const response = await ai.models.generateContent({ model, contents, config });
            return response.text || '';
        } catch (error) {
            lastError = error as Error;
        }
    }
    throw lastError || new AppError('All AI models failed', 500);
}

export interface InsightResult {
    insight: string;
    recommendation: string;
    encouragement: string;
}

export async function generateDailyInsight(
    timelineData: { period: string; label: string; state: string; duration: number }[],
    userContext?: string
): Promise<InsightResult> {
    // Fallback for when API key is not set
    if (!ai) {
        return getFallbackInsight(timelineData);
    }

    const prompt = `${SYSTEM_PROMPT}

Analyze this user's neuroception timeline for today:
${JSON.stringify(timelineData, null, 2)}

${userContext ? `User context: ${userContext}` : ''}

Generate a JSON response with:
{
  "insight": "One sentence about the key pattern you noticed today",
  "recommendation": "One specific, actionable suggestion for tomorrow",
  "encouragement": "One warm, supportive sentence acknowledging their day"
}`;

    try {
        const text = await tryModelWithFallback(prompt, { temperature: 0.7, maxOutputTokens: 1024 });
        let jsonStr = text.trim();
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonStr = match[1].trim();
        if (!jsonStr.startsWith('{')) {
            const objMatch = text.match(/(\{[\s\S]*\})/);
            if (objMatch) jsonStr = objMatch[1].trim();
        }
        return JSON.parse(jsonStr) as InsightResult;
    } catch {
        return getFallbackInsight(timelineData);
    }
}

function getFallbackInsight(timeline: { period: string; label: string; state: string; duration: number }[]): InsightResult {
    const overloaded = timeline.filter(t => t.state === 'overloaded');
    const safe = timeline.filter(t => t.state === 'safe');

    const insights = [
        'Crowded transit and back-to-back meetings caused the sharpest drops in your window of tolerance.',
        'Your body showed the most tension during transitions between activities today.',
        'Morning hours had the highest stress signals — your nervous system took longer to settle.',
    ];

    const recommendations = [
        'Leave 10 minutes earlier tomorrow and enable meeting buffer mode after 11:00 AM.',
        'Try a 2-minute grounding exercise between your first two meetings.',
        'Schedule a short walk after lunch to help your nervous system reset.',
    ];

    const encouragements = [
        'You navigated a demanding day. Every moment of awareness is progress.',
        'Your body\'s signals are getting clearer — that means the system is working for you.',
        'Remember: noticing the pattern is the first step to changing it.',
    ];

    const idx = Math.floor(Math.random() * insights.length);
    return {
        insight: overloaded.length > 0 ? insights[0] : insights[idx],
        recommendation: recommendations[idx],
        encouragement: encouragements[idx],
    };
}
