import { nanoid } from 'nanoid';

export interface Session {
    id: string;
    name: string;
    createdAt: Date;
}

class SessionStore {
    private sessions: Map<string, Session> = new Map();

    create(name: string): Session {
        const id = nanoid(8);
        const session: Session = { id, name, createdAt: new Date() };
        this.sessions.set(id, session);
        return session;
    }

    findByName(name: string): Session | undefined {
        for (const session of this.sessions.values()) {
            if (session.name === name) return session;
        }
        return undefined;
    }

    findById(id: string): Session | undefined {
        return this.sessions.get(id);
    }

    get count(): number {
        return this.sessions.size;
    }
}

export const sessionStore = new SessionStore();
