import { useEffect, useRef, useState, useCallback } from 'react';
import type { PresetSource } from '../models/patch.js';
import { getPreset, getCachedPreset } from '../api/presetApi.js';
import { renderPresetPreview } from '../modules/preview-renderer.js';

export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CacheEntry {
  points: Float32Array;
  audioBuffer: AudioBuffer;
}

// Module-level cache keyed by "source:id"
const cache = new Map<string, CacheEntry>();

// Lazy singleton AudioContext for playback
let playbackCtx: AudioContext | null = null;

function getPlaybackCtx(): AudioContext {
  if (!playbackCtx) playbackCtx = new AudioContext();
  return playbackCtx;
}

export function usePresetPreview(
  source: PresetSource | undefined,
  id: string | undefined,
) {
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [points, setPoints] = useState<Float32Array | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Cleanup previous
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (!source || !id) {
      setStatus('idle');
      setPoints(null);
      setAudioBuffer(null);
      setError(null);
      return;
    }

    const key = `${source}:${id}`;

    // Cache hit → instant
    const hit = cache.get(key);
    if (hit) {
      setPoints(hit.points);
      setAudioBuffer(hit.audioBuffer);
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    // Debounce 200ms to avoid rendering for rapid selections
    debounceRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      (async () => {
        try {
          // Use cached preset data if available, else fetch
          const preset = getCachedPreset(source, id) ?? await getPreset(source, id);
          if (ctrl.signal.aborted) return;

          const result = await renderPresetPreview(preset.data, ctrl.signal);
          if (ctrl.signal.aborted) return;

          cache.set(key, { points: result.points, audioBuffer: result.buffer });
          setPoints(result.points);
          setAudioBuffer(result.buffer);
          setStatus('ready');
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
          setError(err?.message ?? 'Preview failed');
          setStatus('error');
        }
      })();
    }, 200);

    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [source, id]);

  const play = useCallback(() => {
    if (!audioBuffer) return;
    const ctx = getPlaybackCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    src.connect(gain).connect(ctx.destination);
    src.start();
  }, [audioBuffer]);

  return { status, points, audioBuffer, error, play };
}
