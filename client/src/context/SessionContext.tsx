import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SessionData {
    sessionId: string;
    username: string;
}

interface SessionContextValue {
    session: SessionData | null;
    setSession: (data: SessionData) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<SessionData | null>(null);

    return (
        <SessionContext.Provider value={{ session, setSession }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
}
