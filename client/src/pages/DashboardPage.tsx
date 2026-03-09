import { useState, useEffect, useCallback } from 'react';
import { useNeuroStore, NeuroState } from '../stores/neuroStore';
import { api } from '../services/api';
import { useSound } from '../hooks/useSound';
import { useWearable } from '../hooks/useWearable';
import WearablePicker from '../components/wearable/WearablePicker';
import styles from './DashboardPage.module.css';

const STATE_COLORS: Record<NeuroState, string> = { safe: '#67D8B4', guarded: '#F5C469', overloaded: '#EE7C7C' };
const STATE_COPY: Record<NeuroState, string> = {
    safe: '"Your body is in a safe, open state right now."',
    guarded: '"Your body is tightening before your mind catches up."',
    overloaded: '"Your system is approaching overload. Consider a reset."',
};

const INTERVENTIONS = [
    { type: 'grounding_haptic', label: 'Grounding pulse active', icon: '📿', desc: 'Steady haptic rhythm from wearable' },
    { type: 'quiet_route', label: 'Quiet route to Exit B', icon: '🗺️', desc: 'Less crowded path suggested' },
    { type: 'alert_pause', label: 'Non-essential alerts paused', icon: '🔔', desc: 'For 15 minutes' },
    { type: 'micro_reset', label: 'Start 60-Second Reset', icon: '▶️', desc: 'Guided breathing + grounding', primary: true },
];

export default function DashboardPage() {
    const { currentState, confidence, sensors, scores, sessionId, setState, setSensors, setScores, setSessionId } = useNeuroStore();
    const [resetActive, setResetActive] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [dataSource, setDataSource] = useState<'simulated' | 'wearable'>('simulated');
    const [pickerOpen, setPickerOpen] = useState(false);
    const play = useSound();
    const wearable = useWearable();

    // Init session on mount
    useEffect(() => {
        const init = async () => {
            try {
                const res = await api.createSession('Live Monitoring');
                setSessionId(res.session.id);
            } catch { setSessionId('demo'); }
        };
        if (!sessionId) init();
    }, []);

    // Process wearable data when available
    useEffect(() => {
        if (wearable.connected && wearable.data) {
            setDataSource('wearable');
            const wd = wearable.data;
            // Combine wearable-derived signals with estimated values for sensors we can't read
            const sensorInput = {
                breathPace: wd.breathPace,
                jawTension: Math.max(0, wd.skinConductance * 0.6), // estimated from ANS activation
                postureCollapse: Math.max(0, wd.motionRestless * 0.4), // estimated
                skinConductance: wd.skinConductance,
                voiceStrain: Math.max(0, wd.skinConductance * 0.3), // estimated
                motionRestless: wd.motionRestless,
            };
            setSensors(sensorInput);

            // Compute state locally  
            const overall = Math.round(
                Math.min(100, Math.abs(sensorInput.breathPace) * 5) * 0.2 +
                Math.min(100, sensorInput.jawTension * 3) * 0.18 +
                Math.min(100, sensorInput.postureCollapse * 3.5) * 0.15 +
                Math.min(100, sensorInput.skinConductance * 3) * 0.2 +
                Math.min(100, sensorInput.voiceStrain) * 0.15 +
                Math.min(100, sensorInput.motionRestless) * 0.12
            );
            const state: NeuroState = overall >= 65 ? 'overloaded' : overall >= 30 ? 'guarded' : 'safe';
            const conf = Math.min(99, Math.max(50, Math.round(50 + overall * 0.5)));
            setState(state, conf);
            setScores({ breath: 0, jaw: 0, posture: 0, skin: 0, voice: 0, motion: 0, overall });

            // Save reading to DB
            if (sessionId && sessionId !== 'demo') {
                api.recordReading(sessionId, false, 'guarded').catch(() => { });
            }
        }
    }, [wearable.data]);

    // When wearable disconnects, fall back to simulation
    useEffect(() => {
        if (!wearable.connected) setDataSource('simulated');
    }, [wearable.connected]);

    // Simulated sensor readings every 4 seconds (only when no wearable)
    const fetchReading = useCallback(async () => {
        if (dataSource === 'wearable') return; // Skip simulation when wearable connected

        try {
            if (sessionId && sessionId !== 'demo') {
                // Always record through API → saves to DB under user's session
                const res = await api.recordReading(sessionId, true, 'guarded');
                setState(res.result.state, res.result.confidence);
                setSensors({
                    breathPace: res.reading.breathPace, jawTension: res.reading.jawTension,
                    postureCollapse: res.reading.postureCollapse, skinConductance: res.reading.skinConductance,
                    voiceStrain: res.reading.voiceStrain, motionRestless: res.reading.motionRestless,
                });
                setScores(res.result.scores);
                return;
            }

            // Client-side fallback only if no session (shouldn't normally happen)
            const biases: NeuroState[] = ['safe', 'guarded', 'guarded', 'overloaded', 'safe'];
            const bias = biases[Math.floor(Math.random() * biases.length)];
            const r = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
            const simSensors = bias === 'safe'
                ? { breathPace: r(-3, 3), jawTension: r(0, 5), postureCollapse: r(0, 3), skinConductance: r(0, 5), voiceStrain: r(0, 10), motionRestless: r(0, 8) }
                : bias === 'overloaded'
                    ? { breathPace: r(-20, -12), jawTension: r(22, 35), postureCollapse: r(20, 30), skinConductance: r(25, 40), voiceStrain: r(60, 90), motionRestless: r(50, 80) }
                    : { breathPace: r(-15, -5), jawTension: r(10, 22), postureCollapse: r(8, 18), skinConductance: r(10, 25), voiceStrain: r(25, 55), motionRestless: r(15, 40) };
            setSensors(simSensors);
            const overall = Math.round(Math.abs(simSensors.breathPace) * 5 * 0.2 + simSensors.jawTension * 3 * 0.18 + simSensors.postureCollapse * 3.5 * 0.15 + simSensors.skinConductance * 3 * 0.2 + simSensors.voiceStrain * 0.15 + simSensors.motionRestless * 0.12);
            const state: NeuroState = overall >= 65 ? 'overloaded' : overall >= 30 ? 'guarded' : 'safe';
            const conf = Math.min(99, Math.max(50, Math.round(50 + overall * 0.5)));
            setState(state, conf);
            setScores({ breath: 0, jaw: 0, posture: 0, skin: 0, voice: 0, motion: 0, overall });
        } catch { }
    }, [sessionId, dataSource]);

    useEffect(() => {
        fetchReading();
        const interval = setInterval(fetchReading, 4000);
        return () => clearInterval(interval);
    }, [fetchReading]);

    useEffect(() => { play('received'); }, [currentState]);

    const handleIntervention = async (type: string, label: string) => {
        play('send');
        if (type === 'micro_reset') {
            setResetActive(true);
            setTimeout(() => { setResetActive(false); play('received'); }, 3000);
        }
        try {
            if (sessionId && sessionId !== 'demo') {
                await api.triggerIntervention(sessionId, type, label);
            }
        } catch { }
    };

    // Load past sessions
    useEffect(() => {
        api.getSessions().then(r => setSessions(r.sessions || [])).catch(() => { });
    }, []);

    const stateColor = STATE_COLORS[currentState];

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1>Live Detection</h1>
                    <p>Your nervous system state, updated in real time.</p>
                </div>
                {/* Wearable Connection */}
                <div className={styles.wearablePanel}>
                    {wearable.connected ? (
                        <div className={styles.wearableConnected}>
                            <span className={styles.wearableDot} />
                            <span>⌚ {wearable.deviceName}</span>
                            <span className={styles.wearableHr}>{wearable.data?.heartRate || '--'} BPM</span>
                            <button className={styles.wearableBtn} onClick={wearable.disconnect}>Disconnect</button>
                        </div>
                    ) : (
                        <button className={`btn btn-secondary ${styles.connectBtn}`} onClick={() => { play('click'); setPickerOpen(true); }}>
                            ⌚ Connect Wearable
                        </button>
                    )}
                    {wearable.error && <p className={styles.wearableError}>{wearable.error}</p>}
                    <span className={styles.sourceBadge}>
                        {dataSource === 'wearable' ? '🟢 Live from wearable' : '🔵 Simulated data'}
                    </span>
                </div>

                <WearablePicker
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    onConnected={() => { setPickerOpen(false); setDataSource('wearable'); }}
                />
            </div>

            <div className={styles.grid}>
                {/* Main State Card */}
                <div className={`card ${styles.stateCard}`}>
                    <div className={styles.bodyVisual}>
                        <div className={styles.halo} style={{ borderColor: stateColor, boxShadow: `0 0 30px ${stateColor}33` }}>
                            <div className={styles.haloInner} style={{ borderColor: stateColor }} />
                        </div>
                    </div>
                    <div className={styles.stateInfo}>
                        <span className={styles.stateChip} style={{ background: `${stateColor}22`, color: stateColor }}>
                            <span className={styles.dot} style={{ background: stateColor }} />
                            {currentState.charAt(0).toUpperCase() + currentState.slice(1)}
                        </span>
                        <div className={styles.confidence}>{confidence}%</div>
                        <p className={styles.bodyCopy}>{STATE_COPY[currentState]}</p>
                    </div>
                </div>

                {/* Sensors Card */}
                <div className={`card ${styles.sensorsCard}`}>
                    <h3>Sensor Readings</h3>
                    {wearable.connected && wearable.data && (
                        <div className={styles.hrRow}>
                            <span>❤️ Heart Rate</span>
                            <span className={styles.hrValue}>{wearable.data.heartRate} BPM</span>
                        </div>
                    )}
                    <div className={styles.sensorList}>
                        {[
                            { label: 'Breath pace', val: `${sensors.breathPace > 0 ? '+' : ''}${sensors.breathPace}%`, warn: Math.abs(sensors.breathPace) > 10, src: dataSource === 'wearable' ? '⌚' : '' },
                            { label: 'Jaw tension', val: `+${sensors.jawTension}%`, warn: sensors.jawTension > 15, src: dataSource === 'wearable' ? '~' : '' },
                            { label: 'Posture collapse', val: `+${sensors.postureCollapse}%`, warn: sensors.postureCollapse > 12, src: dataSource === 'wearable' ? '~' : '' },
                            { label: 'Skin conductance', val: `+${sensors.skinConductance}%`, warn: sensors.skinConductance > 15, src: dataSource === 'wearable' ? '⌚' : '' },
                            { label: 'Voice strain', val: sensors.voiceStrain > 40 ? 'Strained' : sensors.voiceStrain > 15 ? 'Slight strain' : 'Steady', warn: sensors.voiceStrain > 30, src: dataSource === 'wearable' ? '~' : '' },
                            { label: 'Motion', val: sensors.motionRestless > 40 ? 'Tremor' : sensors.motionRestless > 15 ? 'Fidgeting' : 'Calm', warn: sensors.motionRestless > 30, src: dataSource === 'wearable' ? '⌚' : '' },
                        ].map((s, i) => (
                            <div key={i} className={styles.sensorRow}>
                                <span>{s.label} {s.src && <span className={styles.srcTag}>{s.src}</span>}</span>
                                <span className={`${styles.sensorVal} ${s.warn ? styles.sensorWarn : ''}`}>{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interventions Card */}
                <div className={`card ${styles.interventionCard}`}>
                    <h3>Guided Recovery</h3>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>SafeSignal is helping your body settle.</p>
                    {INTERVENTIONS.map((iv, i) => (
                        iv.primary ? (
                            <button key={i} className={styles.primaryAction} onClick={() => handleIntervention(iv.type, iv.label)} disabled={resetActive}>
                                {resetActive ? '⏳ Reset in progress...' : `${iv.icon} ${iv.label}`}
                            </button>
                        ) : (
                            <div key={i} className={styles.interventionItem} onClick={() => handleIntervention(iv.type, iv.label)}>
                                <span className={styles.ivIcon}>{iv.icon}</span>
                                <div>
                                    <strong>{iv.label}</strong>
                                    <p>{iv.desc}</p>
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Session History */}
                <div className={`card ${styles.sessionsCard}`}>
                    <h3>Session History</h3>
                    <p className={styles.historyNote}>All sessions are saved under your account.</p>
                    {sessions.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>No past sessions yet. Your data will appear here as you use SafeSignal.</p>
                    ) : (
                        <div className={styles.sessionList}>
                            {sessions.slice(0, 8).map((s: any) => (
                                <div key={s.id} className={styles.sessionItem}>
                                    <span className={styles.dot} style={{ background: STATE_COLORS[s.state as NeuroState] || '#ccc' }} />
                                    <div className={styles.sessionInfo}>
                                        <span>{s.label || 'Session'}</span>
                                        <span className={styles.sessionMeta}>
                                            {new Date(s.startedAt).toLocaleString()} · {s._count?.readings || 0} readings
                                        </span>
                                    </div>
                                    <span className={styles.sessionState} style={{ color: STATE_COLORS[s.state as NeuroState] || '#ccc' }}>
                                        {s.state}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
