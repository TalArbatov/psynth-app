import { projectServiceUrl } from '../config/api.js';
import type { PresetSource, PresetSummary, Preset } from '../models/patch.js';

// ── Cache infrastructure ──

const SUMMARY_TTL = 60_000;   // 60 s
const PATCH_TTL   = 300_000;  // 5 min

type CacheEntry<T> = { data: T; at: number };

const summaryCache = new Map<string, CacheEntry<PresetSummary[]>>();
const presetCache  = new Map<string, CacheEntry<Preset>>();
const inflight     = new Map<string, Promise<any>>();

function cached<T>(map: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
  const e = map.get(key);
  if (!e) return null;
  if (Date.now() - e.at > ttl) { map.delete(key); return null; }
  return e.data;
}

function cache<T>(map: Map<string, CacheEntry<T>>, key: string, data: T): void {
  map.set(key, { data, at: Date.now() });
}

function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

function pkey(source: PresetSource, id: string) { return `${source}:${id}`; }

/** Normalize server preset objects: _id → id, data_json → data */
function normalizeSummary(raw: any, source?: PresetSource): PresetSummary {
  return {
    ...raw,
    id: raw.id ?? raw._id,
    ...(source ? { source } : {}),
    ...(raw.data_json && !raw.data ? { data: raw.data_json } : {}),
    ...(raw.created_at != null ? { createdAt: raw.created_at } : {}),
    ...(raw.updated_at != null ? { updatedAt: raw.updated_at } : {}),
    ...(raw.author_name != null ? { authorName: raw.author_name } : {}),
    ...(raw.likes_count != null ? { likeCount: raw.likes_count } : {}),
    ...(raw.liked_by_me != null ? { likedByMe: raw.liked_by_me } : {}),
    ...(raw.favorited_by_me != null ? { favoritedByMe: raw.favorited_by_me } : {}),
  };
}

// ── Fetch helper ──

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(projectServiceUrl(path), { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// ── List endpoints ──

export function listFactory(q?: string): Promise<PresetSummary[]> {
  return listTab('factory', q);
}

export function listSaved(q?: string): Promise<PresetSummary[]> {
  return listTab('saved', q);
}

export function listPublic(q?: string): Promise<PresetSummary[]> {
  return listTab('public', q);
}

function listTab(source: PresetSource, q?: string): Promise<PresetSummary[]> {
  const cacheKey = q ? `${source}?q=${q}` : source;
  if (!q) {
    const hit = cached(summaryCache, source, SUMMARY_TTL);
    if (hit) return Promise.resolve(hit);
  }
  return dedup(`list:${cacheKey}`, async () => {
    const path = q
      ? `/api/presets/${source}?q=${encodeURIComponent(q)}`
      : `/api/presets/${source}`;
    const body = await api<{ data: any[] }>(path);
    const items = (body.data ?? []).map(s => normalizeSummary(s, source));
    if (!q) cache(summaryCache, source, items);
    return items;
  });
}

// ── Single preset ──

export function getPreset(source: PresetSource, id: string): Promise<Preset> {
  const key = pkey(source, id);
  const hit = cached(presetCache, key, PATCH_TTL);
  if (hit) return Promise.resolve(hit);

  return dedup(`get:${key}`, async () => {
    const res = await api<any>(`/api/presets/${source}/${id}`);
    // Server returns { data: { _id, name, ..., data_json: { voices, filter, ... } } }
    const record = res.data ?? res;
    const preset: Preset = {
      id: record._id ?? record.id ?? id,
      source,
      name: record.name ?? record.preset_name ?? '',
      data: record.data_json ?? record.data ?? record,
    };
    cache(presetCache, key, preset);
    return preset;
  });
}

/** Background prefetch — fire-and-forget. */
export function prefetchPreset(source: PresetSource, id: string): void {
  getPreset(source, id).catch(() => {});
}

/** Return cached preset if available, else null. */
export function getCachedPreset(source: PresetSource, id: string): Preset | null {
  return cached(presetCache, pkey(source, id), PATCH_TTL);
}

// ── Mutations ──

export async function createSaved(body: {
  name: string;
  data: Record<string, any>;
  copiedFrom?: { source: PresetSource; id: string };
}): Promise<PresetSummary> {
  const { data, ...rest } = body;
  const result = await api<any>('/api/presets/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...rest, data_json: data }),
  });
  summaryCache.delete('saved');
  const record = result.preset ?? result.data ?? result;
  return normalizeSummary(record, 'saved');
}

export async function updateSaved(id: string, body: {
  name?: string;
  data?: Record<string, any>;
}): Promise<PresetSummary> {
  const { data, ...rest } = body;
  const payload = data ? { ...rest, data_json: data } : rest;
  const result = await api<any>(`/api/presets/saved/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  summaryCache.delete('saved');
  presetCache.delete(pkey('saved', id));
  const record = result.preset ?? result.data ?? result;
  return normalizeSummary(record, 'saved');
}

export async function deleteSaved(id: string): Promise<void> {
  await api<{ ok: true }>(`/api/presets/saved/${id}`, { method: 'DELETE' });
  summaryCache.delete('saved');
  presetCache.delete(pkey('saved', id));
}

export async function copyPublicToSaved(id: string, name?: string): Promise<PresetSummary> {
  const result = await api<any>(`/api/presets/public/${id}/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(name ? { name } : {}),
  });
  summaryCache.delete('saved');
  const record = result.preset ?? result.data ?? result;
  return normalizeSummary(record, 'saved');
}

export async function publishSaved(id: string): Promise<void> {
  await api(`/api/presets/public/publish/${id}`, { method: 'POST' });
  summaryCache.delete('public');
}

export async function likePreset(id: string): Promise<{ likeCount: number | null; likedByMe: boolean | null }> {
  const result = await api<any>(`/api/presets/${id}/like`, { method: 'POST' });
  summaryCache.delete('public');
  return { likeCount: result.likes_count ?? result.likeCount ?? null, likedByMe: result.liked_by_me ?? result.likedByMe ?? null };
}

export async function unlikePreset(id: string): Promise<{ likeCount: number | null; likedByMe: boolean | null }> {
  const result = await api<any>(`/api/presets/${id}/like`, { method: 'DELETE' });
  summaryCache.delete('public');
  return { likeCount: result.likes_count ?? result.likeCount ?? null, likedByMe: result.liked_by_me ?? result.likedByMe ?? null };
}

export async function favoritePreset(id: string): Promise<void> {
  await api(`/api/presets/${id}/favorite`, { method: 'POST' });
  summaryCache.delete('public');
}

export async function unfavoritePreset(id: string): Promise<void> {
  await api(`/api/presets/${id}/favorite`, { method: 'DELETE' });
  summaryCache.delete('public');
}

/** Copy any preset to saved (works for factory too). */
export async function copyToSaved(source: PresetSource, id: string, name?: string): Promise<PresetSummary> {
  if (source === 'public') return copyPublicToSaved(id, name);
  const preset = getCachedPreset(source, id) ?? await getPreset(source, id);
  return createSaved({ name: name ?? preset.name, data: preset.data, copiedFrom: { source, id } });
}

// ── Cache management ──

export function invalidateSummaries(source?: PresetSource): void {
  if (source) { summaryCache.delete(source); } else { summaryCache.clear(); }
}
