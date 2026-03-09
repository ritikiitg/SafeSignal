const API_BASE = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('safesignal_token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
}

export const api = {
    // Auth
    register: (email: string, password: string, name?: string) =>
        request<any>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    login: (email: string, password: string) =>
        request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    getMe: () => request<any>('/auth/me'),

    // User
    getProfile: () => request<any>('/user/profile'),
    updateProfile: (data: any) =>
        request<any>('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),

    // Sessions
    getSessions: () => request<any>('/sessions'),
    createSession: (label?: string) =>
        request<any>('/sessions', { method: 'POST', body: JSON.stringify({ label }) }),
    getSession: (id: string) => request<any>(`/sessions/${id}`),
    recordReading: (id: string, simulated = true, bias = 'guarded') =>
        request<any>(`/sessions/${id}/readings`, { method: 'POST', body: JSON.stringify({ simulated, bias }) }),
    simulateReading: (id: string, bias = 'guarded') =>
        request<any>(`/sessions/${id}/simulate?bias=${bias}`),
    triggerIntervention: (id: string, type: string, label: string, description?: string) =>
        request<any>(`/sessions/${id}/interventions`, { method: 'POST', body: JSON.stringify({ type, label, description }) }),

    // Insights
    getReflections: () => request<any>('/insights/reflections'),
    generateTodayReflection: (context?: string) =>
        request<any>('/insights/reflections/today', { method: 'POST', body: JSON.stringify({ context }) }),
    analyzeTimeline: (timelineData?: any, context?: string) =>
        request<any>('/insights/analyze', { method: 'POST', body: JSON.stringify({ timelineData, context }) }),
};
