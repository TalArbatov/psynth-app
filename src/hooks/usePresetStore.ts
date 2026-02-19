import { useCallback, useEffect, useRef, useState } from 'react';
import type { SynthRuntime } from '../application/synth/runtime.js';
import type { LoadedPresetRef, Preset, PresetSource, PresetSummary } from '../models/patch.js';
import * as presetApi from '../api/presetApi.js';
import { capturePresetSnapshot, snapshotsEqual } from '../modules/preset-snapshot.js';

// ── localStorage helpers ──

const LS_REF   = 'psynth.lastPresetRef';
const LS_PATCH = 'psynth.lastPatch';

function readLast(): { ref: LoadedPresetRef; data: Record<string, any> } | null {
  try {
    const r = localStorage.getItem(LS_REF);
    const p = localStorage.getItem(LS_PATCH);
    if (!r || !p) return null;
    return { ref: JSON.parse(r), data: JSON.parse(p) };
  } catch { return null; }
}

function writeLast(ref: LoadedPresetRef, data: Record<string, any>): void {
  try {
    localStorage.setItem(LS_REF, JSON.stringify(ref));
    localStorage.setItem(LS_PATCH, JSON.stringify(data));
  } catch {}
}

function clearLast(): void {
  localStorage.removeItem(LS_REF);
  localStorage.removeItem(LS_PATCH);
}

// ── Tab list state ──

type TabState = { items: PresetSummary[]; loading: boolean; error: string | null };
const emptyTab = (): TabState => ({ items: [], loading: false, error: null });

// ── Public interface ──

export interface PresetStoreValue {
  // Domain state
  loadedRef: LoadedPresetRef | null;
  patchData: Record<string, any> | null;
  resetCount: number;
  isDirty: boolean;

  // Per-tab lists
  lists: Record<PresetSource, TabState>;

  // List management
  fetchTab(source: PresetSource, query?: string): void;

  // Preset loading
  loadPreset(source: PresetSource, id: string): Promise<void>;
  newPatch(): void;
  prevPreset(): void;
  nextPreset(): void;
  canPrev: boolean;
  canNext: boolean;

  // Saving
  saveAs(name: string): Promise<PresetSummary>;
  saveCurrentChanges(): Promise<void>;

  // Preset management
  renamePreset(id: string, name: string): Promise<void>;
  duplicatePreset(source: PresetSource, id: string): Promise<void>;
  likePreset(id: string): Promise<void>;
  favoritePreset(id: string): Promise<void>;
  deletePreset(id: string): Promise<void>;
  copyToSaved(source: PresetSource, id: string, name?: string): Promise<void>;

  // Prefetch
  prefetchPreset(source: PresetSource, id: string): void;
}

// ── Hook implementation ──

export function usePresetStore(runtime: SynthRuntime | null): PresetStoreValue {
  // Domain state
  const [loadedRef, setLoadedRef]   = useState<LoadedPresetRef | null>(null);
  const [patchData, setPatchData]   = useState<Record<string, any> | null>(null);
  const [resetCount, setResetCount] = useState(0);
  const [isDirty, setIsDirty]       = useState(false);
  const cleanRef = useRef<Record<string, any> | null>(null);

  // Tab lists
  const [lists, setLists] = useState<Record<PresetSource, TabState>>({
    factory: emptyTab(),
    saved: emptyTab(),
    public: emptyTab(),
  });
  const tabReqIds = useRef<Record<PresetSource, number>>({ factory: 0, saved: 0, public: 0 });

  // ── A1: Startup — load from localStorage (Option 2) ──

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const last = readLast();
    if (!last) return;  // stay with null patchData → consumer uses default Init

    setLoadedRef(last.ref);
    setPatchData(last.data);
    setResetCount(c => c + 1);
    cleanRef.current = last.data;

    // Background validate
    presetApi.getPreset(last.ref.source, last.ref.id)
      .then(preset => {
        if (!snapshotsEqual(preset.data, last.data)) {
          setPatchData(preset.data);
          setResetCount(c => c + 1);
          cleanRef.current = preset.data;
          writeLast(last.ref, preset.data);
        }
      })
      .catch(() => {}); // keep local version
  }, []);

  // ── Auto-fetch saved list (for prev/next) ──

  useEffect(() => {
    fetchTab('saved');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dirty detection (1 s poll) ──

  useEffect(() => {
    if (!runtime) return;
    const id = setInterval(() => {
      if (!cleanRef.current) { setIsDirty(false); return; }
      const snap = capturePresetSnapshot(runtime);
      setIsDirty(!snapshotsEqual(snap, cleanRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, [runtime]);

  // ── Internal helpers ──

  function markClean(data: Record<string, any>) {
    cleanRef.current = data;
    setIsDirty(false);
  }

  function applyPreset(preset: Preset) {
    const ref: LoadedPresetRef = { source: preset.source, id: preset.id, name: preset.name };
    setLoadedRef(ref);
    setPatchData(preset.data);
    setResetCount(c => c + 1);
    markClean(preset.data);
    writeLast(ref, preset.data);
  }

  function patchSavedList(fn: (items: PresetSummary[]) => PresetSummary[]) {
    setLists(prev => ({ ...prev, saved: { ...prev.saved, items: fn(prev.saved.items) } }));
  }

  // ── Actions ──

  const fetchTab = useCallback((source: PresetSource, query?: string) => {
    const reqId = ++tabReqIds.current[source];
    setLists(prev => ({ ...prev, [source]: { ...prev[source], loading: true, error: null } }));

    const listFn = source === 'factory' ? presetApi.listFactory
                 : source === 'saved'   ? presetApi.listSaved
                 :                         presetApi.listPublic;

    listFn(query)
      .then(items => {
        if (tabReqIds.current[source] !== reqId) return;
        setLists(prev => ({ ...prev, [source]: { items, loading: false, error: null } }));
      })
      .catch(err => {
        if (tabReqIds.current[source] !== reqId) return;
        setLists(prev => ({
          ...prev,
          [source]: { ...prev[source], loading: false, error: err.message },
        }));
      });
  }, []);

  const loadPreset = useCallback(async (source: PresetSource, id: string) => {
    const preset = await presetApi.getPreset(source, id);
    // GET endpoint only returns patch data; look up name from list summaries
    if (!preset.name) {
      const summary = lists[source]?.items.find(s => s.id === id);
      if (summary) preset.name = summary.name;
    }
    applyPreset(preset);
  }, [lists]);

  const newPatch = useCallback(() => {
    setLoadedRef(null);
    setPatchData(null);
    setResetCount(c => c + 1);
    cleanRef.current = null;
    setIsDirty(false);
    clearLast();
  }, []);

  // Navigate within the same source category as the currently loaded preset
  const currentSource = loadedRef?.source ?? 'saved';
  const sourceItems = lists[currentSource]?.items ?? [];
  const currentIndex = loadedRef
    ? sourceItems.findIndex(s => s.id === loadedRef.id)
    : -1;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < sourceItems.length - 1;

  const prevPreset = useCallback(() => {
    if (!canPrev) return;
    const t = sourceItems[currentIndex - 1];
    if (t) loadPreset(t.source, t.id);
  }, [canPrev, sourceItems, currentIndex, loadPreset]);

  const nextPreset = useCallback(() => {
    if (!canNext) return;
    const t = sourceItems[currentIndex + 1];
    if (t) loadPreset(t.source, t.id);
  }, [canNext, sourceItems, currentIndex, loadPreset]);

  const saveAs = useCallback(async (name: string): Promise<PresetSummary> => {
    if (!runtime) throw new Error('Runtime not ready');
    const data = capturePresetSnapshot(runtime);
    const summary = await presetApi.createSaved({ name, data });

    const ref: LoadedPresetRef = { source: 'saved', id: summary.id, name };
    setLoadedRef(ref);
    markClean(data);
    writeLast(ref, data);
    patchSavedList(items => [summary, ...items]);

    return summary;
  }, [runtime]);

  const saveCurrentChanges = useCallback(async () => {
    if (!runtime || !loadedRef || loadedRef.source !== 'saved') return;
    const data = capturePresetSnapshot(runtime);
    const updated = await presetApi.updateSaved(loadedRef.id, { data });

    markClean(data);
    writeLast(loadedRef, data);
    patchSavedList(items => items.map(s => s.id === loadedRef.id ? { ...s, ...updated } : s));
  }, [runtime, loadedRef]);

  const renamePreset = useCallback(async (id: string, name: string) => {
    const updated = await presetApi.updateSaved(id, { name });
    patchSavedList(items => items.map(s => s.id === id ? { ...s, ...updated } : s));

    setLoadedRef(prev => {
      if (prev?.source === 'saved' && prev.id === id) {
        const next = { ...prev, name };
        if (cleanRef.current) writeLast(next, cleanRef.current);
        return next;
      }
      return prev;
    });
  }, []);

  const duplicatePreset = useCallback(async (source: PresetSource, id: string) => {
    const preset = presetApi.getCachedPreset(source, id) ?? await presetApi.getPreset(source, id);
    const summary = await presetApi.createSaved({ name: `${preset.name} copy`, data: preset.data });
    patchSavedList(items => [summary, ...items]);
  }, []);

  const toggleLikePreset = useCallback(async (id: string) => {
    const current = lists.public.items.find(s => s.id === id);
    const wasLiked = current?.likedByMe ?? false;
    const prevCount = current?.likeCount ?? 0;
    const result = wasLiked
      ? await presetApi.unlikePreset(id)
      : await presetApi.likePreset(id);
    const likeCount = result.likeCount != null ? result.likeCount : Math.max(0, prevCount + (wasLiked ? -1 : 1));
    const likedByMe = result.likedByMe != null ? result.likedByMe : !wasLiked;
    setLists(prev => ({
      ...prev,
      public: {
        ...prev.public,
        items: prev.public.items.map(s =>
          s.id === id ? { ...s, likeCount, likedByMe } : s,
        ),
      },
    }));
  }, [lists.public.items]);

  const toggleFavoritePreset = useCallback(async (id: string) => {
    const current = lists.public.items.find(s => s.id === id);
    const wasFavorited = current?.favoritedByMe ?? false;
    if (wasFavorited) {
      await presetApi.unfavoritePreset(id);
    } else {
      await presetApi.favoritePreset(id);
    }
    setLists(prev => ({
      ...prev,
      public: {
        ...prev.public,
        items: prev.public.items.map(s =>
          s.id === id ? { ...s, favoritedByMe: !wasFavorited } : s,
        ),
      },
    }));
  }, [lists.public.items]);

  const deletePreset = useCallback(async (id: string) => {
    await presetApi.deleteSaved(id);
    patchSavedList(items => items.filter(s => s.id !== id));

    setLoadedRef(prev => {
      if (prev?.source === 'saved' && prev.id === id) {
        clearLast();
        return null;
      }
      return prev;
    });
  }, []);

  const copyToSavedAction = useCallback(async (source: PresetSource, id: string, name?: string) => {
    const summary = await presetApi.copyToSaved(source, id, name);
    patchSavedList(items => [summary, ...items]);
  }, []);

  const prefetchAction = useCallback((source: PresetSource, id: string) => {
    presetApi.prefetchPreset(source, id);
  }, []);

  return {
    loadedRef, patchData, resetCount, isDirty,
    lists,

    fetchTab,
    loadPreset,
    newPatch,
    prevPreset,
    nextPreset,
    canPrev,
    canNext,

    saveAs,
    saveCurrentChanges,

    renamePreset,
    duplicatePreset,
    likePreset: toggleLikePreset,
    favoritePreset: toggleFavoritePreset,
    deletePreset,
    copyToSaved: copyToSavedAction,

    prefetchPreset: prefetchAction,
  };
}
