import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useWearable — Web Bluetooth API hook for connecting smartwatches & heart rate monitors.
 * 
 * Reads Heart Rate Measurement (standard BLE profile) and derives:
 * - breathPace: estimated from heart rate variability
 * - skinConductance: inferred from elevated/lowered HR
 * - motionRestless: if hr spikes without exercise context
 * 
 * If the browser doesn't support Web Bluetooth or no device is paired,
 * the dashboard falls back to simulated data automatically.
 */

export interface WearableData {
    heartRate: number;
    rrIntervals: number[];  // R-R intervals in ms (heart rate variability)
    breathPace: number;
    skinConductance: number;
    motionRestless: number;
    timestamp: number;
}

interface WearableState {
    connected: boolean;
    deviceName: string | null;
    data: WearableData | null;
    error: string | null;
    supported: boolean;
}

// Heart Rate Service UUID (standard BLE)
const HR_SERVICE = 'heart_rate';
const HR_MEASUREMENT = 'heart_rate_measurement';

// Baseline HR — personalized after 30s of readings
let baselineHR = 72;
let hrHistory: number[] = [];

function deriveNeuroSignals(heartRate: number, rrIntervals: number[]): Partial<WearableData> {
    // Track baseline
    hrHistory.push(heartRate);
    if (hrHistory.length > 30) {
        baselineHR = Math.round(hrHistory.slice(-30).reduce((a, b) => a + b) / 30);
        hrHistory = hrHistory.slice(-60);
    }

    const deviation = heartRate - baselineHR;
    const deviationPct = (deviation / baselineHR) * 100;

    // HRV from R-R intervals (lower HRV = more stress)
    let hrv = 50; // default medium
    if (rrIntervals.length >= 2) {
        const diffs = rrIntervals.slice(1).map((v, i) => Math.abs(v - rrIntervals[i]));
        const rmssd = Math.sqrt(diffs.reduce((a, b) => a + b * b, 0) / diffs.length);
        hrv = Math.min(100, rmssd); // RMSSD in ms, higher = calmer
    }

    // Breath pace: HRV correlates with breathing rhythm
    // Low HRV → rapid/shallow breathing → negative breathPace
    const breathPace = hrv > 40 ? -(100 - hrv) * 0.15 : -(100 - hrv) * 0.3;

    // Skin conductance proxy: elevated HR → sympathetic activation
    const skinConductance = Math.max(0, deviationPct * 1.5);

    // Motion/restlessness: sudden HR spikes suggest fidgeting/stress
    const motionRestless = Math.max(0, Math.min(100, deviationPct * 2));

    return { breathPace, skinConductance, motionRestless };
}

export function useWearable() {
    const [state, setState] = useState<WearableState>({
        connected: false,
        deviceName: null,
        data: null,
        error: null,
        supported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    });

    const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const deviceRef = useRef<BluetoothDevice | null>(null);

    const parseHeartRate = useCallback((event: Event) => {
        const value = (event.target as unknown as BluetoothRemoteGATTCharacteristic).value!;
        const flags = value.getUint8(0);
        const is16Bit = flags & 0x01;

        const heartRate = is16Bit ? value.getUint16(1, true) : value.getUint8(1);

        // Extract R-R intervals if present
        const rrIntervals: number[] = [];
        const hasRR = flags & 0x10;
        if (hasRR) {
            let offset = is16Bit ? 3 : 2;
            // Skip energy expended if present
            if (flags & 0x08) offset += 2;
            while (offset < value.byteLength - 1) {
                rrIntervals.push(value.getUint16(offset, true) / 1024 * 1000); // Convert to ms
                offset += 2;
            }
        }

        const derived = deriveNeuroSignals(heartRate, rrIntervals);
        const data: WearableData = {
            heartRate,
            rrIntervals,
            breathPace: derived.breathPace || 0,
            skinConductance: derived.skinConductance || 0,
            motionRestless: derived.motionRestless || 0,
            timestamp: Date.now(),
        };

        setState(s => ({ ...s, data }));
    }, []);

    const connect = useCallback(async () => {
        if (!state.supported) {
            setState(s => ({ ...s, error: 'Web Bluetooth not supported in this browser. Use Chrome or Edge.' }));
            return;
        }

        try {
            setState(s => ({ ...s, error: null }));
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [HR_SERVICE] }],
                optionalServices: [HR_SERVICE],
            });

            deviceRef.current = device;
            device.addEventListener('gattserverdisconnected', () => {
                setState(s => ({ ...s, connected: false, deviceName: null, data: null }));
            });

            const server = await device.gatt!.connect();
            const service = await server.getPrimaryService(HR_SERVICE);
            const char = await service.getCharacteristic(HR_MEASUREMENT);
            charRef.current = char;

            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', parseHeartRate);

            setState(s => ({
                ...s,
                connected: true,
                deviceName: device.name || 'Unknown Device',
                error: null,
            }));
        } catch (err: any) {
            if (err.name === 'NotFoundError') {
                setState(s => ({ ...s, error: 'No device selected. Please try again.' }));
            } else {
                setState(s => ({ ...s, error: err.message || 'Failed to connect' }));
            }
        }
    }, [state.supported, parseHeartRate]);

    const disconnect = useCallback(() => {
        if (charRef.current) {
            charRef.current.removeEventListener('characteristicvaluechanged', parseHeartRate);
            charRef.current.stopNotifications().catch(() => { });
        }
        if (deviceRef.current?.gatt?.connected) {
            deviceRef.current.gatt.disconnect();
        }
        deviceRef.current = null;
        charRef.current = null;
        setState(s => ({ ...s, connected: false, deviceName: null, data: null }));
    }, [parseHeartRate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { disconnect(); };
    }, []);

    return { ...state, connect, disconnect };
}
