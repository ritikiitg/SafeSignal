import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNeuroStore } from '../stores/neuroStore';
import { api } from '../services/api';
import { useSound } from '../hooks/useSound';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const { darkMode, toggleDarkMode, soundEnabled, toggleSound } = useNeuroStore();
    const play = useSound();
    const [name, setName] = useState(user?.name || '');
    const [sensitivity, setSensitivity] = useState(user?.sensitivityLevel || 'medium');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true); play('click');
        try {
            const res = await api.updateProfile({ name, sensitivityLevel: sensitivity });
            updateUser(res.user);
            setSaved(true); play('send');
            setTimeout(() => setSaved(false), 2000);
        } catch { } finally { setSaving(false); }
    };

    return (
        <div className={styles.page}>
            <h1>Profile & Settings</h1>
            <p style={{ marginBottom: 'var(--space-6)' }}>Customize your SafeSignal experience.</p>

            <div className={styles.grid}>
                <div className={`card ${styles.section}`}>
                    <h3>Profile</h3>
                    <div className={styles.field}>
                        <label>Name</label>
                        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className={styles.field}>
                        <label>Email</label>
                        <input className="input" value={user?.email || ''} disabled />
                    </div>
                    <div className={styles.field}>
                        <label>Sensitivity Level</label>
                        <div className={styles.radioGroup}>
                            {['low', 'medium', 'high'].map(level => (
                                <label key={level} className={`${styles.radio} ${sensitivity === level ? styles.radioActive : ''}`}>
                                    <input type="radio" name="sensitivity" value={level} checked={sensitivity === level} onChange={() => { setSensitivity(level); play('click'); }} />
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </label>
                            ))}
                        </div>
                        <p className={styles.hint}>Higher sensitivity detects subtler changes sooner.</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className={styles.settingsCol}>
                    <div className={`card ${styles.section}`}>
                        <h3>Preferences</h3>
                        <div className={styles.toggleRow}>
                            <div><strong>Dark Mode</strong><p>Reduce visual stimulation</p></div>
                            <button className={`${styles.toggle} ${darkMode ? styles.toggleOn : ''}`} onClick={() => { toggleDarkMode(); play('click'); }}>
                                <span className={styles.toggleThumb} />
                            </button>
                        </div>
                        <div className={styles.toggleRow}>
                            <div><strong>Sound Effects</strong><p>Audio feedback on interactions</p></div>
                            <button className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ''}`} onClick={() => { toggleSound(); play('click'); }}>
                                <span className={styles.toggleThumb} />
                            </button>
                        </div>
                    </div>

                    <div className={`card ${styles.section}`}>
                        <h3>Safeguards</h3>
                        {[
                            { icon: '🙌', label: 'Consent-first sensing', desc: 'No passive monitoring of others', on: true },
                            { icon: '🔒', label: 'Private by default', desc: 'All data encrypted on-device', on: true },
                            { icon: '🛑', label: 'Manual override', desc: 'Mute all interventions instantly', on: true },
                            { icon: '🛡️', label: 'Anti-misuse protection', desc: 'No employer/school/partner access', on: true },
                        ].map((sg, i) => (
                            <div key={i} className={styles.safeguardRow}>
                                <span>{sg.icon}</span>
                                <div><strong>{sg.label}</strong><p>{sg.desc}</p></div>
                                <span className={styles.safeguardBadge}>Active</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
