import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SynthLayout } from './components/SynthLayout';
import { StartPage } from './components/StartPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authUrl } from './config/api';
import { SessionProvider } from './context/SessionContext';
import { bootstrapSynth } from './application/synth/bootstrap.js';
import type { SynthRuntime } from './application/synth/runtime.js';

declare global {
  interface Window {
    __synthAppStarted?: boolean;
  }
}

function SynthPage() {
  const runtimeRef = useRef<SynthRuntime | null>(null);
  const [runtime, setRuntime] = useState<SynthRuntime | null>(null);
  const { username, loading, setUsername } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!username) {
      navigate('/login', { replace: true });
      return;
    }
    if (!window.__synthAppStarted) {
      window.__synthAppStarted = true;
      runtimeRef.current = bootstrapSynth();
      setRuntime(runtimeRef.current);
    }
  }, [username, loading, navigate]);

  async function handleLogout() {
    try {
      await fetch(authUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // proceed with client-side logout even if the request fails
    }
    setUsername(null);
    navigate('/login');
  }

  if (loading || !username) return null;

  return (
    <>
      <div className="app-topbar">
        <span className="topbar-welcome">welcome {username}</span>
        <button className="topbar-logout" onClick={() => void handleLogout()}>Logout</button>
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
          <Route path="/synth" element={<SynthPage />} />
          <Route path="/session/:sessionId" element={<SynthPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
