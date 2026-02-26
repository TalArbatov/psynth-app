import { authServiceUrl } from '../config/api.js';

// ── Types ──

export interface AccountInfo {
    email: string;
    username: string;
    displayName: string;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
}

export interface Session {
    id: string;
    userAgent: string;
    ip: string;
    createdAt: string;
    lastSeenAt: string;
    isCurrent: boolean;
}

// ── Helpers ──

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

async function identityFetch<T>(
    path: string,
    init?: RequestInit,
): Promise<T> {
    const headers: Record<string, string> = { ...init?.headers as Record<string, string> };
    if (init?.body) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(authServiceUrl(path), {
        credentials: 'include',
        ...init,
        headers,
    });

    if (res.status === 401) {
        throw new ApiError(401, 'Not authenticated');
    }

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new ApiError(
            res.status,
            data?.message ?? `Request failed (${res.status})`,
        );
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
}

// ── Account endpoints ──

/** GET /api/v1/accounts/me */
export function getMe(): Promise<AccountInfo> {
    return identityFetch<AccountInfo>('/api/v1/accounts/me');
}

/** PATCH /api/v1/accounts/me */
export function updateMe(body: { displayName: string }): Promise<AccountInfo> {
    return identityFetch<AccountInfo>('/api/v1/accounts/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

/** POST /api/v1/accounts/change-password */
export function changePassword(body: {
    currentPassword: string;
    newPassword: string;
}): Promise<void> {
    return identityFetch('/api/v1/accounts/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/** GET /api/v1/accounts/sessions */
export function listSessions(): Promise<Session[]> {
    return identityFetch<Session[]>('/api/v1/accounts/sessions');
}

/** DELETE /api/v1/accounts/sessions/:id */
export function revokeSession(id: string): Promise<void> {
    return identityFetch(`/api/v1/accounts/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

/** POST /api/v1/accounts/logout-all */
export function logoutAll(): Promise<void> {
    return identityFetch('/api/v1/accounts/logout-all', { method: 'POST' });
}

/** DELETE /api/v1/accounts */
export function deleteAccount(): Promise<void> {
    return identityFetch('/api/v1/accounts/me', { method: 'DELETE' });
}

// ── Avatar endpoints ──

/** GET /api/v1/me/avatar/url */
export function getAvatarUrl(): Promise<{ url: string | null }> {
    return identityFetch<{ url: string | null }>('/api/v1/me/avatar/url');
}

/** POST /api/v1/me/avatar/upload-url */
export function getAvatarUploadUrl(body: {
    contentType: string;
    contentLength: number;
}): Promise<{
    key: string;
    uploadUrl: string;
    requiredHeaders: { 'content-type': string };
}> {
    return identityFetch('/api/v1/me/avatar/upload-url', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/** POST /api/v1/me/avatar/confirm */
export function confirmAvatar(body: { key: string }): Promise<{ ok: true }> {
    return identityFetch('/api/v1/me/avatar/confirm', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

// ── Email verification endpoints ──

export interface ResendResult {
    ok: boolean;
    rateLimited: boolean;
    retrySeconds: number;
}

/** POST /api/v1/auth/resend-verification — handles 429 without throwing */
export async function resendVerification(): Promise<ResendResult> {
    const res = await fetch(authServiceUrl('/api/v1/auth/resend-verification'), {
        method: 'POST',
        credentials: 'include',
    });

    if (res.status === 429) {
        const data = await res.json().catch(() => null);
        const retryHeader = res.headers.get('Retry-After');
        const retrySeconds = data?.retrySeconds
            ?? (retryHeader ? parseInt(retryHeader, 10) : 60);
        return { ok: false, rateLimited: true, retrySeconds };
    }

    if (res.status === 401) throw new ApiError(401, 'Not authenticated');

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
    }

    return { ok: true, rateLimited: false, retrySeconds: 0 };
}

/** POST /api/v1/auth/verify-email */
export function verifyEmail(body: { token: string }): Promise<{ ok: true; emailVerified: true }> {
    return identityFetch('/api/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
