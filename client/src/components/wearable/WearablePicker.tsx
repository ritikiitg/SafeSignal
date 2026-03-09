import { useState } from 'react';
import { useWearable } from '../../hooks/useWearable';
import { useSound } from '../../hooks/useSound';
import styles from './WearablePicker.module.css';

interface WearableOption {
    id: string;
    name: string;
    sub?: string;
    icon: string;
    color: string;
    type: 'device' | 'app';
}

const WEARABLES: WearableOption[] = [
    { id: 'apple', name: 'Apple Watch', icon: '⌚', color: '#333', type: 'device' },
    { id: 'fitbit', name: 'Fitbit Watch', icon: '💜', color: '#00B0B9', type: 'device' },
    { id: 'garmin', name: 'Garmin Watch', icon: '🔺', color: '#007CC3', type: 'device' },
    { id: 'samsung', name: 'Samsung Watch', sub: 'via Health Connect', icon: '💙', color: '#1428A0', type: 'device' },
    { id: 'mi', name: 'Mi Band / Amazfit', icon: '🟠', color: '#FF6900', type: 'device' },
    { id: 'other_ble', name: 'Other BLE Device', sub: 'Any heart rate monitor', icon: '📡', color: '#666', type: 'device' },
];

const HEALTH_APPS: WearableOption[] = [
    { id: 'google_fit', name: 'Google Fit', sub: 'via Health Connect', icon: '❤️', color: '#4285F4', type: 'app' },
    { id: 'fitbit_app', name: 'Fitbit App', icon: '💜', color: '#00B0B9', type: 'app' },
    { id: 'apple_health', name: 'Apple Health', icon: '🩺', color: '#FF2D55', type: 'app' },
    { id: 'samsung_health', name: 'Samsung Health', sub: 'via Health Connect', icon: '💙', color: '#1428A0', type: 'app' },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConnected: () => void;
}

export default function WearablePicker({ isOpen, onClose, onConnected }: Props) {
    const wearable = useWearable();
    const play = useSound();
    const [selected, setSelected] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    if (!isOpen) return null;

    const handleSelect = async (option: WearableOption) => {
        play('click');
        setSelected(option.id);
        setConnecting(true);

        if (option.type === 'device') {
            // All BLE devices use the same Web Bluetooth HR profile
            try {
                await wearable.connect();
                play('send');
                onConnected();
            } catch {
                // Error handled in hook
            }
        } else {
            // Health apps: show simulated connection (API integration would be server-side)
            setTimeout(() => {
                play('send');
                setConnecting(false);
                onConnected();
            }, 1500);
        }
        setConnecting(false);
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>Connect a Device</h3>
                    <button className={styles.closeBtn} onClick={() => { play('click'); onClose(); }}>✕</button>
                </div>

                <p className={styles.sectionLabel}>Got a wearable device? Tap to sync &gt;</p>
                <div className={styles.optionList}>
                    {WEARABLES.map(opt => (
                        <button
                            key={opt.id}
                            className={`${styles.optionRow} ${selected === opt.id ? styles.optionSelected : ''}`}
                            onClick={() => handleSelect(opt)}
                            disabled={connecting}
                        >
                            <span className={styles.optionIcon} style={{ background: `${opt.color}15`, color: opt.color }}>{opt.icon}</span>
                            <div className={styles.optionInfo}>
                                <span className={styles.optionName}>{opt.name}</span>
                                {opt.sub && <span className={styles.optionSub}>{opt.sub}</span>}
                            </div>
                            <span className={`${styles.optionRadio} ${selected === opt.id ? styles.radioActive : ''}`}>
                                {selected === opt.id && connecting ? (
                                    <span className={styles.spinner} />
                                ) : selected === opt.id ? (
                                    <span className={styles.radioCheck}>✓</span>
                                ) : null}
                            </span>
                        </button>
                    ))}
                </div>

                <p className={styles.sectionLabel}>Health app: &gt;</p>
                <div className={styles.optionList}>
                    {HEALTH_APPS.map(opt => (
                        <button
                            key={opt.id}
                            className={`${styles.optionRow} ${selected === opt.id ? styles.optionSelected : ''}`}
                            onClick={() => handleSelect(opt)}
                            disabled={connecting}
                        >
                            <span className={styles.optionIcon} style={{ background: `${opt.color}15`, color: opt.color }}>{opt.icon}</span>
                            <div className={styles.optionInfo}>
                                <span className={styles.optionName}>{opt.name}</span>
                                {opt.sub && <span className={styles.optionSub}>{opt.sub}</span>}
                            </div>
                            <span className={`${styles.optionRadio} ${selected === opt.id ? styles.radioActive : ''}`}>
                                {selected === opt.id && connecting ? (
                                    <span className={styles.spinner} />
                                ) : selected === opt.id ? (
                                    <span className={styles.radioCheck}>✓</span>
                                ) : null}
                            </span>
                        </button>
                    ))}
                </div>

                <div className={styles.footer}>
                    <p>SafeSignal uses <strong>Bluetooth Low Energy</strong> to read heart rate data from your wearable. No data leaves your device.</p>
                </div>
            </div>
        </>
    );
}
