import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import type { SynthRuntime } from '../application/synth/runtime.js';
import type {
  EnvPatch,
  FxPatch,
  LfoPatch,
  ModDestination,
  ModRouting,
  ModSource,
  OscPatch,
  Patch,
} from '../models/patch.js';
import { DEFAULT_PATCH } from '../models/patch.js';

// ── Actions ──

type PatchAction =
  | { type: 'SET_OSC'; index: 0 | 1; patch: Partial<OscPatch> }
  | { type: 'SET_LFO'; index: number; patch: Partial<LfoPatch> }
  | { type: 'SET_ENVELOPE'; index: 0 | 1; patch: Partial<EnvPatch> }
  | { type: 'SET_FX'; key: keyof FxPatch; patch: Partial<FxPatch[keyof FxPatch]> }
  | { type: 'SET_GLOBAL'; patch: Partial<Patch['global']> }
  | { type: 'ADD_MOD_ROUTING'; routing: ModRouting }
  | { type: 'UPDATE_MOD_ROUTING'; id: string; amount: number }
  | { type: 'REMOVE_MOD_ROUTING'; id: string }
  | { type: 'LOAD_PATCH'; patch: Patch }
  | { type: 'UNDO' }
  | { type: 'REDO' };

interface PatchState {
  current: Patch;
  undoStack: Patch[];
  redoStack: Patch[];
}

// ── Reducer ──

function pushUndo(state: PatchState): PatchState {
  return {
    ...state,
    undoStack: [...state.undoStack.slice(-49), state.current],
    redoStack: [],
  };
}

function patchReducer(state: PatchState, action: PatchAction): PatchState {
  switch (action.type) {
    case 'SET_OSC': {
      const s = pushUndo(state);
      const oscs = [...s.current.oscillators] as [OscPatch, OscPatch];
      oscs[action.index] = { ...oscs[action.index], ...action.patch };
      return { ...s, current: { ...s.current, oscillators: oscs } };
    }
    case 'SET_LFO': {
      const s = pushUndo(state);
      const lfos = [...s.current.lfos] as [LfoPatch, LfoPatch, LfoPatch, LfoPatch];
      lfos[action.index] = { ...lfos[action.index], ...action.patch };
      return { ...s, current: { ...s.current, lfos } };
    }
    case 'SET_ENVELOPE': {
      const s = pushUndo(state);
      const envs = [...s.current.envelopes] as [EnvPatch, EnvPatch];
      envs[action.index] = { ...envs[action.index], ...action.patch };
      return { ...s, current: { ...s.current, envelopes: envs } };
    }
    case 'SET_FX': {
      const s = pushUndo(state);
      const fx = { ...s.current.fx };
      (fx as Record<string, unknown>)[action.key] = {
        ...(fx[action.key] as Record<string, unknown>),
        ...action.patch,
      };
      return { ...s, current: { ...s.current, fx } };
    }
    case 'SET_GLOBAL': {
      const s = pushUndo(state);
      return { ...s, current: { ...s.current, global: { ...s.current.global, ...action.patch } } };
    }
    case 'ADD_MOD_ROUTING': {
      const s = pushUndo(state);
      return { ...s, current: { ...s.current, modMatrix: [...s.current.modMatrix, action.routing] } };
    }
    case 'UPDATE_MOD_ROUTING': {
      const s = pushUndo(state);
      return {
        ...s,
        current: {
          ...s.current,
          modMatrix: s.current.modMatrix.map((r) =>
            r.id === action.id ? { ...r, amount: action.amount } : r,
          ),
        },
      };
    }
    case 'REMOVE_MOD_ROUTING': {
      const s = pushUndo(state);
      return {
        ...s,
        current: {
          ...s.current,
          modMatrix: s.current.modMatrix.filter((r) => r.id !== action.id),
        },
      };
    }
    case 'LOAD_PATCH': {
      const s = pushUndo(state);
      return { ...s, current: action.patch };
    }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        current: prev,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.current],
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        current: next,
        undoStack: [...state.undoStack, state.current],
        redoStack: state.redoStack.slice(0, -1),
      };
    }
    default:
      return state;
  }
}

// ── Context ──

interface PatchContextValue {
  patch: Patch;
  dispatch: React.Dispatch<PatchAction>;
  canUndo: boolean;
  canRedo: boolean;
  dragSource: ModSource | null;
  setDragSource: (source: ModSource | null) => void;
}

const PatchContext = createContext<PatchContextValue | null>(null);

// ── Provider ──

export function PatchProvider({
  children,
  runtime,
}: {
  children: ReactNode;
  runtime: SynthRuntime | null;
}) {
  // Try loading from localStorage
  const initialState: PatchState = {
    current: loadPatchFromStorage() ?? DEFAULT_PATCH,
    undoStack: [],
    redoStack: [],
  };
  const [state, dispatch] = useReducer(patchReducer, initialState);
  const [dragSource, setDragSource] = useReducer(
    (_: ModSource | null, v: ModSource | null) => v,
    null,
  );

  // Keep a ref to the latest patch for the animation loop
  const patchRef = useRef(state.current);
  patchRef.current = state.current;

  // Expose patchRef on runtime so the animation loop can access it
  useEffect(() => {
    if (!runtime) return;
    (runtime as SynthRuntime & { getPatch?: () => Patch }).getPatch = () => patchRef.current;
  }, [runtime]);

  // Runtime bridge: sync patch changes to audio engine
  useEffect(() => {
    if (!runtime) return;
    const p = state.current;

    // Oscillators
    p.oscillators.forEach((osc, i) => {
      const voice = runtime.engine.voices[i];
      voice.setEnabled(osc.enabled);
      voice.setWaveform(osc.waveform);
      voice.setVolume(osc.level);
      voice.setDetune(osc.fine);
      voice.setUnisonCount(osc.unisonCount);
      voice.setUnisonDetune(osc.unisonDetune);
      voice.setUnisonSpread(osc.unisonSpread / 100);
    });

    // Global filter
    runtime.engine.setFilterEnabled(p.global.filterEnabled);
    runtime.engine.setFilterType(p.global.filterType);
    runtime.engine.setFilterCutoff(p.global.filterCutoff);
    runtime.engine.setFilterResonance(p.global.filterResonance);

    // LFOs - patch has 4 flat global LFOs, runtime has [2][4] per-osc
    // Apply each patch LFO to both oscillator slots
    p.lfos.forEach((lfo, i) => {
      for (let osc = 0; osc < runtime.lfos.length; osc++) {
        const runtimeLfo = runtime.lfos[osc]?.[i];
        if (!runtimeLfo) continue;
        runtimeLfo.waveform = lfo.waveform;
        runtimeLfo.rate = lfo.rate;
        runtimeLfo.depth = lfo.depth;
        runtimeLfo.phase = lfo.phase;
        runtimeLfo.delay = lfo.delay;
        runtimeLfo.fadeIn = lfo.fadeIn;
        runtimeLfo.bpmSync = lfo.bpmSync;
        runtimeLfo.bpm = lfo.bpm;
        runtimeLfo.syncDivision = lfo.syncDivision;
        runtimeLfo.oneShot = lfo.oneShot;
      }
    });

    // Master volume
    runtime.state.baseMasterVolume = p.global.masterVolume;
    runtime.engine.setMasterVolume(p.global.masterVolume);

    // FX
    const fx = p.fx;
    runtime.fxChain.saturation.setEnabled(fx.saturation.enabled);
    runtime.fxChain.saturation.set({
      type: fx.saturation.type,
      drive: fx.saturation.drive,
      output: fx.saturation.output,
      tone: fx.saturation.tone,
      mix: fx.saturation.mix,
    });
    runtime.fxChain.eq.setEnabled(fx.eq.enabled);
    runtime.fxChain.eq.set({
      hpFreq: fx.eq.hpFreq,
      bandFreq: fx.eq.bandFreq,
      bandGain: fx.eq.bandGain,
      bandQ: fx.eq.bandQ,
      shelfFreq: fx.eq.shelfFreq,
      shelfGain: fx.eq.shelfGain,
    });
    runtime.fxChain.chorus.setEnabled(fx.chorus.enabled);
    runtime.fxChain.chorus.set({
      rate: fx.chorus.rate,
      depth: fx.chorus.depth,
      delay: fx.chorus.delay,
      spread: fx.chorus.spread,
      mix: fx.chorus.mix,
    });
    runtime.fxChain.delay.setEnabled(fx.delay.enabled);
    runtime.fxChain.delay.set({
      time: fx.delay.time,
      feedback: fx.delay.feedback,
      mix: fx.delay.mix,
      pingPong: fx.delay.pingPong,
      filterFreq: fx.delay.filterFreq,
    });
    runtime.fxChain.reverb.setEnabled(fx.reverb.enabled);
    runtime.fxChain.reverb.set({
      size: fx.reverb.size,
      preDelay: fx.reverb.preDelay,
      damping: fx.reverb.damping,
      mix: fx.reverb.mix,
    });
    runtime.fxChain.compressor.setEnabled(fx.compressor.enabled);
    runtime.fxChain.compressor.set({
      threshold: fx.compressor.threshold,
      ratio: fx.compressor.ratio,
      attack: fx.compressor.attack,
      release: fx.compressor.release,
      makeup: fx.compressor.makeup,
    });
  }, [runtime, state.current]);

  // Save to localStorage on patch change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      savePatchToStorage(state.current);
    }, 500);
    return () => clearTimeout(timer);
  }, [state.current]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          dispatch({ type: 'REDO' });
        } else if (e.key === 's') {
          e.preventDefault();
          savePatchToStorage(state.current);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.current]);

  const value = useMemo<PatchContextValue>(
    () => ({
      patch: state.current,
      dispatch,
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
      dragSource,
      setDragSource,
    }),
    [state, dragSource],
  );

  return <PatchContext.Provider value={value}>{children}</PatchContext.Provider>;
}

// ── Hooks ──

export function usePatch(): PatchContextValue {
  const ctx = useContext(PatchContext);
  if (!ctx) throw new Error('usePatch must be used within PatchProvider');
  return ctx;
}

export function useOsc(index: 0 | 1) {
  const { patch, dispatch } = usePatch();
  const osc = patch.oscillators[index];
  const setOsc = useCallback(
    (p: Partial<OscPatch>) => dispatch({ type: 'SET_OSC', index, patch: p }),
    [dispatch, index],
  );
  return { osc, setOsc };
}

export function useLfo(index: number) {
  const { patch, dispatch } = usePatch();
  const lfo = patch.lfos[index];
  const setLfo = useCallback(
    (p: Partial<LfoPatch>) => dispatch({ type: 'SET_LFO', index, patch: p }),
    [dispatch, index],
  );
  return { lfo, setLfo };
}

export function useModRoutingsFor(destination: ModDestination) {
  const { patch } = usePatch();
  return useMemo(
    () => patch.modMatrix.filter((r) => r.destination === destination),
    [patch.modMatrix, destination],
  );
}

// ── localStorage helpers ──

const STORAGE_KEY = 'synth-patch-v1';

function loadPatchFromStorage(): Patch | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (parsed?.version === 1) return parsed as Patch;
    return null;
  } catch {
    return null;
  }
}

function savePatchToStorage(patch: Patch): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patch));
  } catch {
    // silently ignore
  }
}
