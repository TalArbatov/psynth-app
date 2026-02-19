import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SynthRuntime } from '../../application/synth/runtime.js';
import type { PresetSource, PresetSummary } from '../../models/patch.js';
import type { PresetStoreValue } from '../../hooks/usePresetStore.js';
import { usePresetPreview } from '../../hooks/usePresetPreview.js';
import { WaveformStrip } from './WaveformStrip.js';

type Props = {
  open: boolean;
  onClose: () => void;
  store: PresetStoreValue;
  runtime: SynthRuntime | null;
};

const TABS: { key: PresetSource; label: string }[] = [
  { key: 'factory', label: 'Factory' },
  { key: 'saved',   label: 'Saved' },
  { key: 'public',  label: 'Public' },
];

const PREFETCH_DELAY = 200;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function PresetBrowser({ open, onClose, store, runtime }: Props) {
  const [activeTab, setActiveTab]     = useState<PresetSource>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'delete'; id: string; name: string }
    | null
  >(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  const renameRef = useRef<HTMLInputElement>(null);

  const listRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Disable synth keyboard only when a text input is focused ──

  useEffect(() => {
    if (!runtime || !open) return;
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        runtime.state.keyboardEnabled = false;
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        runtime.state.keyboardEnabled = true;
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    runtime.state.keyboardEnabled = true;
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      runtime.state.keyboardEnabled = true;
    };
  }, [open, runtime]);

  // ── Reset UI state on open ──

  useEffect(() => {
    if (!open) return;
    setSearchQuery('');
    setSelectedIndex(0);
    setHoveredIndex(null);
    setConfirmAction(null);
    setRenaming(false);
    setCopiedIds(new Set());
  }, [open]);

  // ── Fetch tab list on tab switch or open ──

  useEffect(() => {
    if (!open) return;
    store.fetchTab(activeTab);
  }, [open, activeTab, store.fetchTab]);

  // ── Debounced server search ──

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!open) return;
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      store.fetchTab(activeTab);
      return;
    }
    searchTimer.current = setTimeout(() => {
      store.fetchTab(activeTab, searchQuery.trim());
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [open, activeTab, searchQuery, store.fetchTab]);

  // ── Derive visible items ──

  const tab = store.lists[activeTab];
  const items = useMemo(() => {
    if (!searchQuery.trim()) return tab.items;
    // Local filter as fast fallback while server search is in-flight
    const q = searchQuery.toLowerCase();
    return tab.items.filter(p => p.name.toLowerCase().includes(q));
  }, [tab.items, searchQuery]);

  // Clamp selection
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(0, items.length - 1)));
    setHoveredIndex(null);
  }, [items.length]);

  // ── Auto-load on selection ──

  useEffect(() => {
    clearTimeout(prefetchTimer.current);
    const item = items[selectedIndex];
    if (!item) return;
    prefetchTimer.current = setTimeout(() => {
      store.loadPreset(item.source, item.id);
    }, PREFETCH_DELAY);
    return () => clearTimeout(prefetchTimer.current);
  }, [selectedIndex, items, store.loadPreset]);

  // ── Scroll selected into view ──

  useEffect(() => {
    const row = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // ── Helpers ──

  const activePresetKey = store.loadedRef
    ? `${store.loadedRef.source}:${store.loadedRef.id}`
    : null;

  const isCurrent = (s: PresetSummary) =>
    activePresetKey === `${s.source}:${s.id}`;

  // ── Delete ──

  const attemptDelete = useCallback((s: PresetSummary) => {
    setConfirmAction({ type: 'delete', id: s.id, name: s.name });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return;
    await store.deletePreset(confirmAction.id);
    setConfirmAction(null);
  }, [confirmAction, store.deletePreset]);

  // ── Keyboard nav ──

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (confirmAction) {
        if (e.key === 'Escape') setConfirmAction(null);
        return;
      }
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, items.length - 1));
          setHoveredIndex(null);
          setRenaming(false);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          setHoveredIndex(null);
          setRenaming(false);
          break;
        case 'Enter':
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, items, selectedIndex, onClose, confirmAction]);

  // ── Focused item ──

  const focused = items[selectedIndex] as PresetSummary | undefined;

  // ── Audio preview ──

  const preview = usePresetPreview(focused?.source, focused?.id);

  // ── Rename handlers ──

  const startRename = useCallback(() => {
    if (!focused) return;
    setRenameValue(focused.name);
    setRenaming(true);
    requestAnimationFrame(() => renameRef.current?.select());
  }, [focused]);

  const commitRename = useCallback(() => {
    if (!focused || !renaming) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== focused.name) {
      store.renamePreset(focused.id, trimmed);
    }
    setRenaming(false);
  }, [focused, renaming, renameValue, store]);

  if (!open) return null;

  // ── Detail pane badge label ──

  const badgeLabel = (source: PresetSource) =>
    source === 'factory' ? 'FACTORY' : source === 'saved' ? 'SAVED' : 'PUBLIC';

  return createPortal(
    <div className="preset-browser-backdrop" onClick={onClose}>
      <div className="preset-browser" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="preset-browser-header">
          <span className="preset-browser-title">Presets</span>
          <button className="preset-browser-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body: left panel + detail pane */}
        <div className="preset-browser-body">
          {/* Left panel */}
          <div className="preset-browser-left">
            {/* Tabs */}
            <div className="preset-browser-tabs">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`preset-browser-tab${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => { setActiveTab(t.key); setSelectedIndex(0); setHoveredIndex(null); setRenaming(false); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              ref={searchRef}
              className="preset-browser-search"
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            {/* List */}
            <div className="preset-browser-list" ref={listRef}>
              {tab.loading && items.length === 0 && (
                <div className="preset-browser-empty">Loading...</div>
              )}
              {!tab.loading && items.length === 0 && (
                <div className="preset-browser-empty">
                  {tab.error ? `Error: ${tab.error}` : 'No presets'}
                </div>
              )}
              {items.map((preset, i) => (
                <div
                  key={`${preset.source}:${preset.id}`}
                  className={
                    'preset-browser-row'
                    + (isCurrent(preset) ? ' current' : '')
                    + (i === selectedIndex ? ' selected' : '')
                    + (i === hoveredIndex ? ' focused' : '')
                  }
                  onClick={() => { setSelectedIndex(i); setRenaming(false); }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className="preset-browser-row-name">{preset.name}</span>
                  {isCurrent(preset) && <span className="preset-browser-badge">CURRENT</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Detail pane */}
          <div className="preset-browser-detail">
            {focused ? (
              <>
                {/* Name (or rename input) */}
                {renaming ? (
                  <div className="preset-detail-rename-row">
                    <input
                      ref={renameRef}
                      className="preset-detail-rename"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenaming(false);
                      }}
                    />
                    <button className="preset-detail-rename-save" onClick={commitRename} aria-label="Save name">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11.5 13H2.5C2.10218 13 1.72064 12.842 1.43934 12.5607C1.15804 12.2794 1 11.8978 1 11.5V2.5C1 2.10218 1.15804 1.72064 1.43934 1.43934C1.72064 1.15804 2.10218 1 2.5 1H9.5L13 4.5V11.5C13 11.8978 12.842 12.2794 12.5607 12.5607C12.2794 12.842 11.8978 13 11.5 13Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 13V8H4V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 1V4H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="preset-detail-name">{focused.name}</div>
                )}

                {/* Meta */}
                <div className="preset-detail-meta">
                  <span className="preset-detail-badge">{badgeLabel(focused.source)}</span>
                  {focused.authorName && <span>By {focused.authorName}</span>}
                  {focused.updatedAt && <span>{relativeTime(focused.updatedAt)}</span>}
                </div>

                {/* Like & Favorite (public tab only) */}
                {activeTab === 'public' && (
                  <div className="preset-detail-social">
                    <button
                      className={`preset-detail-like${focused.likedByMe ? ' liked' : ''}`}
                      onClick={() => store.likePreset(focused.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill={focused.likedByMe ? 'currentColor' : 'none'}>
                        <path d="M4.5 6V12.5M1.5 7.5V11C1.5 11.8284 2.17157 12.5 3 12.5H10.2526C10.9569 12.5 11.5643 12.0074 11.7082 11.3176L12.6082 7.06762C12.8035 6.13207 12.0945 5.25 11.1389 5.25H8.75V2.5C8.75 1.80964 8.19036 1.25 7.5 1.25L4.5 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{focused.likeCount ?? 0}</span>
                    </button>
                    <button
                      className={`preset-detail-favorite${focused.favoritedByMe ? ' favorited' : ''}`}
                      onClick={() => store.favoritePreset(focused.id)}
                      aria-label={focused.favoritedByMe ? 'Unfavorite' : 'Favorite'}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill={focused.favoritedByMe ? 'currentColor' : 'none'}>
                        <path d="M7 1.5l1.72 3.49 3.85.56-2.79 2.72.66 3.83L7 10.27 3.56 12.1l.66-3.83L1.43 5.55l3.85-.56L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Waveform preview */}
                <WaveformStrip
                  points={preview.points}
                  status={preview.status}
                  error={preview.error}
                  onPlay={preview.play}
                />

                {/* Actions */}
                <div className="preset-detail-actions">
                  {activeTab === 'saved' && (
                    <>
                      <button className="preset-browser-btn" onClick={startRename}>Rename</button>
                      <button className="preset-browser-btn" onClick={() => store.duplicatePreset(focused.source, focused.id)}>
                        Duplicate
                      </button>
                      <button className="preset-browser-btn danger" onClick={() => attemptDelete(focused)}>
                        Delete
                      </button>
                    </>
                  )}
                  {(activeTab === 'factory' || activeTab === 'public') && (
                    <button
                      className={`preset-browser-btn${copiedIds.has(focused.id) ? ' done' : ''}`}
                      disabled={copiedIds.has(focused.id)}
                      onClick={() => store.copyToSaved(focused.source, focused.id).then(() => setCopiedIds(s => new Set(s).add(focused!.id)))}
                    >
                      {copiedIds.has(focused.id) ? (<><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="#4caf50" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> Saved</>) : 'Copy to Saved'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="preset-browser-empty">No preset selected</div>
            )}
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmAction?.type === 'delete' && (
          <div className="preset-browser-confirm">
            <p>Delete &ldquo;{confirmAction.name}&rdquo;?</p>
            <div className="preset-browser-confirm-actions">
              <button className="preset-browser-btn danger" onClick={handleDeleteConfirm}>Delete</button>
              <button className="preset-browser-btn" onClick={() => setConfirmAction(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
