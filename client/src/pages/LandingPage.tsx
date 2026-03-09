import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSound } from '../hooks/useSound';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    const play = useSound();
    const [activeCase, setActiveCase] = useState(0);

    const useCases = [
        { title: 'Commute Overload', icon: '🚆', desc: 'Ritika enters a packed train. SafeSignal detects rising threat response before she notices. Wearable sends a grounding pulse, app suggests a calmer exit.', outcome: 'Overload prevented before panic peaks.' },
        { title: 'Stressful Meeting', icon: '💼', desc: 'During a meeting, voice flattens and posture tightens. SafeSignal shifts to Guarded, delays notifications, activates breath pacing.', outcome: 'She stays present instead of shutting down.' },
        { title: 'End-of-Day Reflection', icon: '🌙', desc: 'Ritika reviews her daily window-of-tolerance timeline. She sees which moments drained her and which restored her.', outcome: 'Stronger self-understanding and better planning.' },
    ];

    const safeguards = [
        { icon: '🙌', title: 'Consent-First', desc: 'No passive monitoring of others.' },
        { icon: '🔒', title: 'Private by Default', desc: 'All data encrypted on-device.' },
        { icon: '💬', title: 'No Truth Claims', desc: 'Confidence-based language only.' },
        { icon: '🛑', title: 'Manual Override', desc: 'Mute all interventions instantly.' },
        { icon: '🚨', title: 'Emergency Mode', desc: 'Grounding + trusted-contact alerts.' },
        { icon: '🛡️', title: 'Anti-Misuse', desc: 'No employer/school/partner access.' },
    ];

    return (
        <div className={styles.landing}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.haloContainer}>
                    {[0, 1, 2, 3, 4].map(i => <div key={i} className={styles.haloRing} style={{ animationDelay: `${i * 0.7}s` }} />)}
                </div>
                <nav className={styles.topNav}>
                    <div className={styles.topBrand}>
                        <img src="/assets/logo_favi.png" alt="SafeSignal" className={styles.topLogo} />
                        <span className={styles.topBrandName}>SafeSignal</span>
                    </div>
                    <Link to="/auth" className="btn btn-primary" onClick={() => play('click')}>Get Started</Link>
                </nav>
                <div className={styles.heroContent}>
                    <p className={styles.label}>Introducing SafeSignal</p>
                    <h1>What if your body could <span className={styles.highlight}>warn you</span> before you shut down?</h1>
                    <p className={styles.heroSub}>SafeSignal tracks neuroception — your body's pre-conscious sense of safety vs danger — and helps you recover before panic, dissociation, or shutdown.</p>
                    <Link to="/auth" className="btn btn-primary btn-lg" onClick={() => play('send')}>Start Your Journey →</Link>
                </div>
            </section>

            {/* Problem */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <p className={styles.label}>The Problem</p>
                    <h2>Meet Ritika</h2>
                    <p>24, junior product designer. Freezes in crowds and high-stakes meetings. Only realizes she was overwhelmed <em>after</em> it's over.</p>
                </div>
                <div className={styles.problemGrid}>
                    <div className={`card ${styles.problemCard}`} style={{ borderLeft: '4px solid var(--color-overloaded)' }}>
                        <h3>😖 "I notice too late"</h3>
                        <p>After the panic peaks. After the meeting is ruined. After the commute leaves her drained.</p>
                    </div>
                    <div className={`card ${styles.problemCard}`} style={{ borderLeft: '4px solid var(--color-guarded)' }}>
                        <h3>🚫 Current tools fail</h3>
                        <p>Meditation apps need active engagement. Fitness trackers show heart rate, not emotional state. Nothing warns her <em>before</em> shutdown.</p>
                    </div>
                </div>
            </section>

            {/* Neuroception */}
            <section className={`${styles.section} ${styles.sectionAlt}`}>
                <div className={styles.sectionHeader}>
                    <p className={styles.label}>The Hidden Sense</p>
                    <h2>What is Neuroception?</h2>
                    <p>Your body constantly scans the environment for safety cues — before your conscious mind catches up.</p>
                </div>
                <div className={styles.neuroFlow}>
                    {['🔍 Body Detects', '⚡ Pre-Conscious Signal', '💡 SafeSignal Surfaces It', '🌱 Guided Recovery'].map((step, i) => (
                        <div key={i} className={styles.neuroStep}>
                            <div className={styles.neuroIcon}>{step.split(' ')[0]}</div>
                            <span>{step.split(' ').slice(1).join(' ')}</span>
                            {i < 3 && <span className={styles.neuroArrow}>→</span>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Use Cases */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <p className={styles.label}>Real Scenarios</p>
                    <h2>Three Moments That Matter</h2>
                </div>
                <div className={styles.useCaseTabs}>
                    {useCases.map((uc, i) => (
                        <button key={i} className={`${styles.tab} ${activeCase === i ? styles.tabActive : ''}`} onClick={() => { setActiveCase(i); play('click'); }}>
                            {uc.icon} {uc.title}
                        </button>
                    ))}
                </div>
                <div className={`card ${styles.useCaseDetail}`}>
                    <p className={styles.useCaseDesc}>{useCases[activeCase].desc}</p>
                    <div className={styles.useCaseOutcome}>
                        <strong>✓ Outcome:</strong> {useCases[activeCase].outcome}
                    </div>
                </div>
            </section>

            {/* Safeguards */}
            <section className={`${styles.section} ${styles.sectionAlt}`}>
                <div className={styles.sectionHeader}>
                    <p className={styles.label}>Trust & Privacy</p>
                    <h2>Built on Safeguards</h2>
                </div>
                <div className={styles.safeguardGrid}>
                    {safeguards.map((sg, i) => (
                        <div key={i} className={`card ${styles.safeguardCard}`}>
                            <span className={styles.sgIcon}>{sg.icon}</span>
                            <h4>{sg.title}</h4>
                            <p>{sg.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className={styles.section} style={{ textAlign: 'center' }}>
                <h2>Making the <span className={styles.highlight}>invisible</span> visible.</h2>
                <p style={{ maxWidth: 500, margin: '1rem auto 2rem' }}>SafeSignal helps you understand your body, trust it, and build a life that doesn't overwhelm you.</p>
                <Link to="/auth" className="btn btn-primary btn-lg" onClick={() => play('send')}>Get Started Free →</Link>
            </section>

            <footer className={styles.footer}>
                <img src="/assets/logo_favi.png" alt="SafeSignal" style={{ height: 24, marginBottom: 8, borderRadius: 4 }} />
                <p>SafeSignal — Sense safety before you think it.  ·  Built for Devpost 2026</p>
            </footer>
        </div>
    );
}
