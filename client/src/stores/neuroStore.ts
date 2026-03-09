import { create } from 'zustand';

export type NeuroState = 'safe' | 'guarded' | 'overloaded';

interface NeuroStoreState {
    currentState: NeuroState;
    confidence: number;
    sessionId: string | null;
    sensors: {
        breathPace: number;
        jawTension: number;
        postureCollapse: number;
        skinConductance: number;
        voiceStrain: number;
        motionRestless: number;
    };
    scores: {
        breath: number; jaw: number; posture: number;
        skin: number; voice: number; motion: number; overall: number;
    };
    darkMode: boolean;
    soundEnabled: boolean;

    setState: (state: NeuroState, confidence: number) => void;
    setSensors: (sensors: any) => void;
    setScores: (scores: any) => void;
    setSessionId: (id: string | null) => void;
    toggleDarkMode: () => void;
    toggleSound: () => void;
}

export const useNeuroStore = create<NeuroStoreState>((set) => ({
    currentState: 'safe',
    confidence: 95,
    sessionId: null,
    sensors: {
        breathPace: 0, jawTension: 0, postureCollapse: 0,
        skinConductance: 0, voiceStrain: 0, motionRestless: 0,
    },
    scores: {
        breath: 0, jaw: 0, posture: 0, skin: 0, voice: 0, motion: 0, overall: 0,
    },
    darkMode: localStorage.getItem('safesignal_dark') !== 'false',
    soundEnabled: localStorage.getItem('safesignal_sound') !== 'false',

    setState: (currentState, confidence) => set({ currentState, confidence }),
    setSensors: (sensors) => set({ sensors }),
    setScores: (scores) => set({ scores }),
    setSessionId: (sessionId) => set({ sessionId }),
    toggleDarkMode: () => set((s) => {
        const next = !s.darkMode;
        localStorage.setItem('safesignal_dark', String(next));
        return { darkMode: next };
    }),
    toggleSound: () => set((s) => {
        const next = !s.soundEnabled;
        localStorage.setItem('safesignal_sound', String(next));
        return { soundEnabled: next };
    }),
}));
