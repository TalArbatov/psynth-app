import { apiUrl } from '../config/api.js';

export async function createSession(
  name: string,
  maxUsers: number,
): Promise<string> {
  const res = await fetch(apiUrl('/session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, maxUsers }),
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const data = (await res.json()) as { sessionId?: string };
  if (!data.sessionId) throw new Error('Missing sessionId in response');
  return data.sessionId;
}

export async function findSession(name: string): Promise<string> {
  const res = await fetch(apiUrl(`/session?name=${encodeURIComponent(name)}`));
  if (!res.ok) {
    if (res.status === 404) throw new Error('Session not found');
    throw new Error(`Server returned ${res.status}`);
  }
  const data = (await res.json()) as { sessionId?: string };
  if (!data.sessionId) throw new Error('Missing sessionId in response');
  return data.sessionId;
}
