import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SynthLayout } from './components/SynthLayout';
import { StartPage } from './components/StartPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage.js';
import { SettingsLayout } from './pages/settings/SettingsLayout.js';
import { ProfileTab } from './pages/settings/ProfileTab.js';
import { SecurityTab } from './pages/settings/SecurityTab.js';
import { PreferencesTab } from './pages/settings/PreferencesTab.js';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { logout } from './api/auth.js';
import { bootstrapSynth } from './application/synth/bootstrap.js';
import type { SynthRuntime } from './application/synth/runtime.js';
import './modules/theme.js';

function SynthPage() {
    const runtimeRef = useRef<SynthRuntime | null>(null);
    const destroyRef = useRef<(() => void) | null>(null);
    const [runtime, setRuntime] = useState<SynthRuntime | null>(null);
    const { username, loading, setUsername } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;
        if (!username) {
            navigate('/login', { replace: true });
            return;
        }
        if (!runtimeRef.current) {
            const result = bootstrapSynth();
            runtimeRef.current = result.runtime;
            destroyRef.current = result.destroy;
            setRuntime(result.runtime);
        }

        return () => {
            destroyRef.current?.();
            destroyRef.current = null;
            runtimeRef.current = null;
            setRuntime(null);
        };
    }, [username, loading, navigate]);

    async function handleLogout() {
        await logout();
        setUsername(null);
        navigate('/login');
    }

    if (loading || !username) return null;

    return (
        <>
            <div className="app-topbar">
                <span className="topbar-welcome">welcome {username}</span>
                <div className="topbar-actions">
                    <button className="topbar-btn" onClick={() => navigate('/settings')}>Account</button>
                    <button className="topbar-btn" onClick={() => void handleLogout()}>Logout</button>
                </div>
            </div>
            <SynthLayout runtime={runtime} />
        </>
    );
}

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SessionProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/start" element={<StartPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/synth" element={<SynthPage />} />
                        <Route path="/session/:sessionId" element={<SynthPage />} />
                        <Route path="/settings" element={<SettingsLayout />}>
                            <Route index element={<ProfileTab />} />
                            <Route path="security" element={<SecurityTab />} />
                            <Route path="preferences" element={<PreferencesTab />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </SessionProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
