import { create } from 'zustand';

interface AuthState {
    token: string | null;
    user: any | null;
    setAuth: (token: string, user: any) => void;
    logout: () => void;
    updateUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('safesignal_token'),
    user: JSON.parse(localStorage.getItem('safesignal_user') || 'null'),

    setAuth: (token, user) => {
        localStorage.setItem('safesignal_token', token);
        localStorage.setItem('safesignal_user', JSON.stringify(user));
        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem('safesignal_token');
        localStorage.removeItem('safesignal_user');
        set({ token: null, user: null });
    },

    updateUser: (user) => {
        localStorage.setItem('safesignal_user', JSON.stringify(user));
        set({ user });
    },
}));
