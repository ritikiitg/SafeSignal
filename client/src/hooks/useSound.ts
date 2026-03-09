import { useCallback } from 'react';
import { useNeuroStore } from '../stores/neuroStore';

const audioCache: Record<string, HTMLAudioElement> = {};

function getAudio(name: string): HTMLAudioElement {
    if (!audioCache[name]) {
        audioCache[name] = new Audio(`/assets/${name}.wav`);
        audioCache[name].volume = 0.3;
    }
    return audioCache[name];
}

export function useSound() {
    const soundEnabled = useNeuroStore((s) => s.soundEnabled);

    const play = useCallback((name: 'click' | 'send' | 'received') => {
        if (!soundEnabled) return;
        try {
            const audio = getAudio(name);
            audio.currentTime = 0;
            audio.play().catch(() => { });
        } catch { }
    }, [soundEnabled]);

    return play;
}
