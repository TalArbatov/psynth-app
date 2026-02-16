import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authUrl } from '../config/api';

interface AuthContextValue {
    username: string | null;
    loading: boolean;
    setUsername: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(authUrl('/auth/me'), { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.user?.username) setUsername(data.user.username);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ username, loading, setUsername }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
