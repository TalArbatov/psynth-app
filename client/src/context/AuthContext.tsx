import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchCurrentUser } from '../api/auth.js';

interface AuthContextValue {
    username: string | null;
    accountId: string | null;
    loading: boolean;
    setUsername: (name: string | null) => void;
    setAccountId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrentUser()
            .then((user) => {
                if (user) {
                    setUsername(user.username || user.email || user.name || 'user');
                    setAccountId(user.id ?? null);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ username, accountId, loading, setUsername, setAccountId }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
