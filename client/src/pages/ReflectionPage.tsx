import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSound } from '../hooks/useSound';
import styles from './ReflectionPage.module.css';

type NeuroState = 'safe' | 'guarded' | 'overloaded';
const STATE_COLORS: Record<NeuroState, string> = { safe: '#67D8B4', guarded: '#F5C469', overloaded: '#EE7C7C' };

const DEFAULT_TIMELINE = [
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

const ICONS: Record<string, string> = { 'Commute': '🚆', 'Standup Meeting': '💼', 'Coffee Break': '☕', 'Deep Work': '💻', 'Lunch': '🍽️', 'Client Call': '📞', 'Design Review': '📋', 'Solo Focus': '🎯', 'Evening Walk': '🌳' };

export default function ReflectionPage() {
    const [timeline] = useState(DEFAULT_TIMELINE);
    const [insight, setInsight] = useState({ insight: '', recommendation: '', encouragement: '' });
    const [loading, setLoading] = useState(false);
    const play = useSound();
    const totalDuration = timeline.reduce((s, t) => s + t.duration, 0);

    useEffect(() => {
        generateInsight();
    }, []);

    const generateInsight = async () => {
        setLoading(true);
        play('click');
        try {
            const res = await api.generateTodayReflection();
            setInsight(res.aiInsight);
        } catch {
            setInsight({
                insight: 'Crowded transit and back-to-back meetings caused the sharpest drops in your window of tolerance.',
                recommendation: 'Leave 10 minutes earlier and enable meeting buffer mode after 11:00 AM.',
                encouragement: 'You navigated a demanding day. Every moment of awareness is progress.',
            });
        } finally {
            setLoading(false); play('received');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Daily Reflection</h1>
                    <p>Your window of tolerance throughout the day.</p>
                </div>
                <button className="btn btn-secondary" onClick={generateInsight} disabled={loading}>
                    {loading ? '⏳ Analyzing...' : '🔄 Refresh Insight'}
                </button>
            </div>

            {/* Timeline Bar */}
            <div className={`card ${styles.timelineCard}`}>
                <h3>Today's Journey</h3>
                <div className={styles.timelineBar}>
                    {timeline.map((t, i) => (
                        <div key={i} className={styles.segment} style={{ flex: t.duration / totalDuration, background: STATE_COLORS[t.state] }} title={`${t.label} — ${t.state}`}>
                            <span className={styles.segLabel}>{t.duration >= 30 ? t.label : ''}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.timeLabels}>
                    <span>7:30 AM</span><span>10:00 AM</span><span>12:30 PM</span><span>3:00 PM</span><span>6:30 PM</span>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Activities */}
                <div className={`card ${styles.activitiesCard}`}>
                    <h3>Activity Breakdown</h3>
                    <div className={styles.actList}>
                        {timeline.map((t, i) => (
                            <div key={i} className={styles.actItem} style={{ background: `${STATE_COLORS[t.state]}11` }}>
                                <span className={styles.actIcon}>{ICONS[t.label] || '📌'}</span>
                                <div className={styles.actInfo}>
                                    <strong>{t.label}</strong>
                                    <span>{t.period} · {t.duration} min</span>
                                </div>
                                <span className={styles.actChip} style={{ background: `${STATE_COLORS[t.state]}22`, color: STATE_COLORS[t.state] }}>
                                    {t.state}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Insights */}
                <div className={styles.insightCol}>
                    <div className={`card ${styles.insightCard}`} style={{ borderLeft: '4px solid var(--color-neutral)' }}>
                        <h4>💡 Today's Insight</h4>
                        <p>{insight.insight || <span className="skeleton" style={{ display: 'inline-block', width: '100%', height: 40 }} />}</p>
                    </div>
                    <div className={`card ${styles.insightCard}`} style={{ borderLeft: '4px solid var(--color-safe)' }}>
                        <h4>🌱 Recommendation</h4>
                        <p>{insight.recommendation || <span className="skeleton" style={{ display: 'inline-block', width: '100%', height: 40 }} />}</p>
                    </div>
                    <div className={`card ${styles.insightCard}`} style={{ borderLeft: '4px solid var(--color-guarded)' }}>
                        <h4>💛 Encouragement</h4>
                        <p>{insight.encouragement || <span className="skeleton" style={{ display: 'inline-block', width: '100%', height: 40 }} />}</p>
                    </div>

                    {/* Stats */}
                    <div className={`card ${styles.statsCard}`}>
                        <h4>Day Summary</h4>
                        <div className={styles.statsGrid}>
                            {[
                                { label: 'Safe', count: timeline.filter(t => t.state === 'safe').length, color: STATE_COLORS.safe },
                                { label: 'Guarded', count: timeline.filter(t => t.state === 'guarded').length, color: STATE_COLORS.guarded },
                                { label: 'Overloaded', count: timeline.filter(t => t.state === 'overloaded').length, color: STATE_COLORS.overloaded },
                            ].map((s, i) => (
                                <div key={i} className={styles.stat}>
                                    <span className={styles.statNum} style={{ color: s.color }}>{s.count}</span>
                                    <span className={styles.statLabel}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
