import { authServiceUrl } from '../config/api.js';

export type AuthUser = {
  id: string;
  username?: string;
  email?: string;
  name?: string;
};

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(authServiceUrl('/auth/me'), { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ?? null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(authServiceUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Login failed (${res.status})`);
  }
  const data = await res.json().catch(() => null);
  return data?.user ?? { id: '' };
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(authServiceUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Registration failed (${res.status})`);
  }
  const data = await res.json().catch(() => null);
  return data?.user ?? { id: '' };
}

export async function logout(): Promise<void> {
  await fetch(authServiceUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
}
