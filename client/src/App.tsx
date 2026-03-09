import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ReflectionPage from './pages/ReflectionPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
        },
    },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    if (!token) return <Navigate to="/auth" replace />;
    return <>{children}</>;
}

function App() {
    const token = useAuthStore((state) => state.token);

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                    <Route path="/auth" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
                    } />
                    <Route path="/reflection" element={
                        <ProtectedRoute><Layout><ReflectionPage /></Layout></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
