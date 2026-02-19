import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SynthRuntime } from '../../application/synth/runtime.js';
import type { LFODivision, LFOTarget, LFOWaveform } from '../../modules/lfo.js';
import { createWaveformPreview } from '../../modules/waveform-preview.js';
import { KnobControl } from './KnobControl';

type OscUIState = {
  enabled: boolean;
  waveform: OscillatorType;
  volume: number;
  detune: number;
  unisonCount: number;
  unisonDetune: number;
  unisonSpread: number;
};

type LfoUIState = {
  waveform: LFOWaveform;
  rate: number;
  depthPct: number;
  phase: number;
  delay: number;
  fadeIn: number;
  bpmSync: boolean;
  bpm: number;
  syncDivision: LFODivision;
  oneShot: boolean;
  targets: LFOTarget[];
};

type DragSource = {
  osc: 1 | 2;
  lfo: 1 | 2 | 3 | 4;
};
type OscDropTarget = Exclude<LFOTarget, 'volume'>;

const LFO_DIVISIONS: LFODivision[] = ['1/1', '1/2', '1/4', '1/8', '1/16'];
const OSC_TARGET_OPTIONS: Array<{ target: LFOTarget; label: string }> = [
  { target: 'filter', label: 'Filter' },
  { target: 'osc-volume', label: 'Osc Volume' },
  { target: 'osc-detune', label: 'Detune' },
  { target: 'osc-unison-detune', label: 'Unison Detune' },
  { target: 'osc-unison-spread', label: 'Stereo Spread' },
];

const INITIAL_OSC: [OscUIState, OscUIState] = [
  {
    enabled: true,
    waveform: 'sawtooth',
    volume: 0.5,
    detune: 0,
    unisonCount: 1,
    unisonDetune: 20,
    unisonSpread: 50,
  },
  {
    enabled: true,
    waveform: 'triangle',
    volume: 0.5,
    detune: 0,
    unisonCount: 1,
    unisonDetune: 20,
    unisonSpread: 50,
  },
];

function createInitialLfo(): LfoUIState {
  return {
    waveform: 'sine',
    rate: 1,
    depthPct: 50,
    phase: 0,
    delay: 0,
    fadeIn: 0,
    bpmSync: false,
    bpm: 120,
    syncDivision: '1/4',
    oneShot: false,
    targets: [],
  };
}

function createInitialLfoSet(): [LfoUIState[], LfoUIState[]] {
  return [
    Array.from({ length: 4 }, () => createInitialLfo()),
    Array.from({ length: 4 }, () => createInitialLfo()),
  ];
}

const LFO_COLORS = ['#00d2ff', '#ff6b9d', '#ffd93d', '#6bff6b'];

function getTargetElementId(target: LFOTarget, osc: 1 | 2): string | null {
  switch (target) {
    case 'filter': return 'filter-section';
    case 'volume': return 'master-volume-section';
    case 'osc-volume': return `volume${osc}-knob`;
    case 'osc-detune': return `detune${osc}-knob`;
    case 'osc-unison-detune': return `unison-detune${osc}-knob`;
    case 'osc-unison-spread': return `unison-spread${osc}-knob`;
    default: return null;
  }
}

function LfoCableOverlay({
  lfoState,
  activeOsc,
  activeLfoTab,
  showCables,
}: {
  lfoState: [LfoUIState[], LfoUIState[]];
  activeOsc: 1 | 2;
  activeLfoTab: [1 | 2 | 3 | 4, 1 | 2 | 3 | 4];
  showCables: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<Array<{ d: string; color: string }>>([]);
  const [resizeCount, setResizeCount] = useState(0);

  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver(() => setResizeCount((c) => c + 1));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!showCables) {
      setPaths([]);
      return;
    }

    const container = svgRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const nextPaths: Array<{ d: string; color: string }> = [];
    const oscIndex = activeOsc - 1;
    const activeTab = activeLfoTab[oscIndex];

    for (let lfoN = 1; lfoN <= 4; lfoN++) {
      const lfo = lfoState[oscIndex][lfoN - 1];
      if (lfo.targets.length === 0) continue;

      const color = LFO_COLORS[lfoN - 1];

      // Source: active tab → MOD chip, inactive tab → LFO tab button
      let sourceEl: Element | null;
      if (lfoN === activeTab) {
        sourceEl = document.getElementById(`lfo-chip-${activeOsc}-${lfoN}`);
      } else {
        sourceEl = document.querySelector(
          `#lfo-section-${activeOsc} .lfo-tab[data-lfo-idx="${lfoN}"]`
        );
      }
      if (!sourceEl) continue;

      const sourceRect = sourceEl.getBoundingClientRect();
      const sx = sourceRect.left + sourceRect.width / 2 - containerRect.left;
      const sy = sourceRect.bottom - containerRect.top;

      for (const target of lfo.targets) {
        const targetId = getTargetElementId(target, activeOsc);
        if (!targetId) continue;

        const targetEl = document.getElementById(targetId);
        if (!targetEl) continue;

        const targetRect = targetEl.getBoundingClientRect();
        const tx = targetRect.left + targetRect.width / 2 - containerRect.left;
        const ty = targetRect.top - containerRect.top;

        const sag = Math.abs(tx - sx) * 0.15 + 30;
        const cx = (sx + tx) / 2;
        const cy = Math.max(sy, ty) + sag;

        nextPaths.push({
          d: `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`,
          color,
        });
      }
    }

    setPaths(nextPaths);
  }, [lfoState, activeOsc, activeLfoTab, showCables, resizeCount]);

  if (!showCables) return null;

  return (
    <svg ref={svgRef} className="lfo-cable-overlay">
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.color} className="lfo-cable" />
      ))}
    </svg>
  );
}

function OscSection({
  n,
  state,
  hidden,
  lfoSection,
  dropForTarget,
  onWaveform,
  onVolume,
  onDetuneInput,
  onUnisonCount,
  onUnisonDetune,
  onUnisonSpread,
}: {
  n: 1 | 2;
  state: OscUIState;
  hidden: boolean;
  lfoSection: ReactNode;
  dropForTarget: (target: OscDropTarget) => {
    active: boolean;
    hover: boolean;
    onDragOver: (e: React.DragEvent<HTMLElement>) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent<HTMLElement>) => void;
  };
  onWaveform: (value: OscillatorType) => void;
  onVolume: (value: number) => void;
  onDetuneInput: (value: number) => void;
  onUnisonCount: (value: number) => void;
  onUnisonDetune: (value: number) => void;
  onUnisonSpread: (value: number) => void;
}) {
  const oscVolumeDrop = dropForTarget('osc-volume');
  const oscDetuneDrop = dropForTarget('osc-detune');
  const oscUnisonDetuneDrop = dropForTarget('osc-unison-detune');
  const oscUnisonSpreadDrop = dropForTarget('osc-unison-spread');

  return (
    <div className={`osc-section${hidden ? ' hidden' : ''}${state.enabled ? '' : ' disabled'}`} id={`osc${n}-section`}>
      <div className="osc-content">
        <div className="controls">
          <div className="control-group">
            <label>Waveform</label>
            <select id={`waveform${n}`} value={state.waveform} onChange={(e) => onWaveform(e.target.value as OscillatorType)}>
              <option value="sine">Sine</option>
              <option value="triangle">Triangle</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="square">Square</option>
            </select>
            <canvas className="waveform-preview" id={`waveform${n}-preview`} width="120" height="30"></canvas>
          </div>
          <div
            className={`control-group${oscVolumeDrop.active ? ' drop-target-active' : ''}${oscVolumeDrop.hover ? ' drop-target-hover' : ''}`}
            onDragOver={oscVolumeDrop.onDragOver}
            onDragLeave={oscVolumeDrop.onDragLeave}
            onDrop={oscVolumeDrop.onDrop}
          >
            <label>Volume</label>
            <KnobControl
              id={`volume${n}`}
              min={0}
              max={1}
              step={0.01}
              value={state.volume}
              displayValue={state.volume.toFixed(2)}
              onValueChange={(value) => onVolume(value)}
            />
          </div>
          <div
            className={`control-group${oscDetuneDrop.active ? ' drop-target-active' : ''}${oscDetuneDrop.hover ? ' drop-target-hover' : ''}`}
            onDragOver={oscDetuneDrop.onDragOver}
            onDragLeave={oscDetuneDrop.onDragLeave}
            onDrop={oscDetuneDrop.onDrop}
          >
            <label>Detune (cents)</label>
            <KnobControl
              id={`detune${n}`}
              min={-100}
              max={100}
              step={1}
              value={state.detune}
              displayValue={`${Math.round(state.detune)}`}
              onValueChange={(value) => onDetuneInput(value)}
            />
          </div>
        </div>

        <div className="controls">
          <div className="control-group">
            <label>Unison Voices</label>
            <KnobControl
              id={`unison-count${n}`}
              min={1}
              max={8}
              step={1}
              value={state.unisonCount}
              displayValue={`${state.unisonCount}`}
              onValueChange={(value) => onUnisonCount(Math.round(value))}
            />
          </div>
          <div
            className={`control-group${oscUnisonDetuneDrop.active ? ' drop-target-active' : ''}${oscUnisonDetuneDrop.hover ? ' drop-target-hover' : ''}`}
            onDragOver={oscUnisonDetuneDrop.onDragOver}
            onDragLeave={oscUnisonDetuneDrop.onDragLeave}
            onDrop={oscUnisonDetuneDrop.onDrop}
          >
            <label>Unison Detune</label>
            <KnobControl
              id={`unison-detune${n}`}
              min={0}
              max={100}
              step={1}
              value={state.unisonDetune}
              displayValue={`${Math.round(state.unisonDetune)}`}
              onValueChange={(value) => onUnisonDetune(value)}
            />
          </div>
          <div
            className={`control-group${oscUnisonSpreadDrop.active ? ' drop-target-active' : ''}${oscUnisonSpreadDrop.hover ? ' drop-target-hover' : ''}`}
            onDragOver={oscUnisonSpreadDrop.onDragOver}
            onDragLeave={oscUnisonSpreadDrop.onDragLeave}
            onDrop={oscUnisonSpreadDrop.onDrop}
          >
            <label>Stereo Spread</label>
            <KnobControl
              id={`unison-spread${n}`}
              min={0}
              max={100}
              step={1}
              value={state.unisonSpread}
              displayValue={`${Math.round(state.unisonSpread)}%`}
              onValueChange={(value) => onUnisonSpread(value)}
            />
          </div>
        </div>

        {lfoSection}

        <canvas className="adsr-canvas" id={`adsr${n}-canvas`} width="560" height="120"></canvas>
        <div className="adsr-values" id={`adsr${n}-values`}></div>
      </div>
    </div>
  );
}

/**
 * React-managed oscillator UI.
 * Keeps DOM IDs stable for canvas-based modules and sync integration.
 */
export function OscPage({ runtime, active, masterVolume, setMasterVolume, activePresetData, resetCount }: {
  runtime: SynthRuntime | null;
  active: boolean;
  masterVolume: number;
  setMasterVolume: (v: number) => void;
  activePresetData: Record<string, any> | null;
  resetCount: number;
}) {
  const [activeOsc, setActiveOsc] = useState<1 | 2>(1);
  const [oscState, setOscState] = useState<[OscUIState, OscUIState]>(INITIAL_OSC);
  const [activeLfoTab, setActiveLfoTab] = useState<[1 | 2 | 3 | 4, 1 | 2 | 3 | 4]>([1, 1]);
  const [lfoState, setLfoState] = useState<[LfoUIState[], LfoUIState[]]>(createInitialLfoSet);
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [filterType, setFilterType] = useState<BiquadFilterType>('lowpass');
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [showCables, setShowCables] = useState(false);

  const wfPreview1Ref = useRef<ReturnType<typeof createWaveformPreview> | null>(null);
  const wfPreview2Ref = useRef<ReturnType<typeof createWaveformPreview> | null>(null);
  const lfoPreviewRef = useRef(new Map<string, ReturnType<typeof createWaveformPreview>>());

  const setVoicePatch = (index: 0 | 1, patch: Partial<OscUIState>) => {
    setOscState((prev) => {
      const next = [...prev] as [OscUIState, OscUIState];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const setLfoPatch = (oscIndex: 0 | 1, lfoIndex: number, patch: Partial<LfoUIState>) => {
    setLfoState((prev) => {
      const next = [prev[0].map((s) => ({ ...s })), prev[1].map((s) => ({ ...s }))] as [LfoUIState[], LfoUIState[]];
      next[oscIndex][lfoIndex] = { ...next[oscIndex][lfoIndex], ...patch };
      return next;
    });
  };

  const applyLfo = (oscIndex: 0 | 1, lfoIndex: number, patch: Partial<LfoUIState>) => {
    if (!runtime) return;
    const lfo = runtime.lfos[oscIndex][lfoIndex];
    if (patch.waveform !== undefined) lfo.waveform = patch.waveform;
    if (patch.rate !== undefined) lfo.rate = patch.rate;
    if (patch.depthPct !== undefined) lfo.depth = patch.depthPct / 100;
    if (patch.phase !== undefined) lfo.phase = patch.phase;
    if (patch.delay !== undefined) lfo.delay = patch.delay;
    if (patch.fadeIn !== undefined) lfo.fadeIn = patch.fadeIn;
    if (patch.bpmSync !== undefined) lfo.bpmSync = patch.bpmSync;
    if (patch.bpm !== undefined) lfo.bpm = patch.bpm;
    if (patch.syncDivision !== undefined) lfo.syncDivision = patch.syncDivision;
    if (patch.oneShot !== undefined) lfo.oneShot = patch.oneShot;
  };

  const toggleLfoTarget = (osc: 1 | 2, lfo: 1 | 2 | 3 | 4, target: LFOTarget) => {
    const oscIndex: 0 | 1 = osc === 1 ? 0 : 1;
    const lfoIndex = lfo - 1;
    const current = lfoState[oscIndex][lfoIndex];
    const hasTarget = current.targets.includes(target);
    const nextTargets = hasTarget
      ? current.targets.filter((t) => t !== target)
      : [...current.targets, target];

    setLfoPatch(oscIndex, lfoIndex, { targets: nextTargets });

    if (!runtime) return;
    const lfoNode = runtime.lfos[oscIndex][lfoIndex];
    if (hasTarget) {
      lfoNode.removeTarget(target);
    } else {
      lfoNode.addTarget(target);
      lfoNode.reset();
    }
  };

  // Initialize waveform previews once canvases are mounted.
  useEffect(() => {
    const c1 = document.getElementById('waveform1-preview') as HTMLCanvasElement | null;
    const c2 = document.getElementById('waveform2-preview') as HTMLCanvasElement | null;
    if (c1 && !wfPreview1Ref.current) wfPreview1Ref.current = createWaveformPreview(c1);
    if (c2 && !wfPreview2Ref.current) wfPreview2Ref.current = createWaveformPreview(c2);
  }, []);

  useEffect(() => {
    wfPreview1Ref.current?.setWaveform(oscState[0].waveform);
    wfPreview2Ref.current?.setWaveform(oscState[1].waveform);
  }, [oscState]);

  useEffect(() => {
    for (let o = 1 as 1 | 2; o <= 2; o++) {
      for (let l = 1 as 1 | 2 | 3 | 4; l <= 4; l++) {
        const key = `${o}-${l}`;
        const canvas = document.getElementById(`lfo-waveform-${o}-${l}-preview`) as HTMLCanvasElement | null;
        if (!canvas) continue;
        let preview = lfoPreviewRef.current.get(key);
        if (!preview) {
          preview = createWaveformPreview(canvas);
          lfoPreviewRef.current.set(key, preview);
        }
        preview.setWaveform(lfoState[o - 1][l - 1].waveform as OscillatorType);
      }
    }
  }, [lfoState]);

  // Keep runtime in sync after bootstrap becomes available.
  useEffect(() => {
    if (!runtime) return;

    oscState.forEach((s, i) => {
      const voice = runtime.engine.voices[i];
      voice.setEnabled(s.enabled);
      voice.setWaveform(s.waveform);
      voice.setVolume(s.volume);
      voice.setDetune(s.detune);
      voice.setUnisonCount(s.unisonCount);
      voice.setUnisonDetune(s.unisonDetune);
      voice.setUnisonSpread(s.unisonSpread / 100);
    });

    runtime.engine.setFilterEnabled(filterEnabled);
    runtime.engine.setFilterType(filterType);

    lfoState.forEach((oscLfos, oscIdx) => {
      oscLfos.forEach((lfo, lfoIdx) => {
        const runtimeLfo = runtime.lfos[oscIdx][lfoIdx];
        runtimeLfo.waveform = lfo.waveform;
        runtimeLfo.rate = lfo.rate;
        runtimeLfo.depth = lfo.depthPct / 100;
        runtimeLfo.phase = lfo.phase;
        runtimeLfo.delay = lfo.delay;
        runtimeLfo.fadeIn = lfo.fadeIn;
        runtimeLfo.bpmSync = lfo.bpmSync;
        runtimeLfo.bpm = lfo.bpm;
        runtimeLfo.syncDivision = lfo.syncDivision;
        runtimeLfo.oneShot = lfo.oneShot;
        runtimeLfo.targets.clear();
        lfo.targets.forEach((target) => runtimeLfo.addTarget(target));
      });
    });

    runtime.state.baseMasterVolume = masterVolume;
    runtime.engine.setMasterVolume(masterVolume);
  }, [runtime]); // intentionally run once when runtime appears

  // One-shot retrigger: reset one-shot LFOs on every note-on.
  useEffect(() => {
    if (!runtime) return;

    const previousHandlers = runtime.engine.voices.map((voice) => voice.onNoteOn);
    runtime.engine.voices.forEach((voice, oscIdx) => {
      voice.onNoteOn = () => {
        runtime.lfos[oscIdx].forEach((lfo) => {
          if (lfo.oneShot) lfo.reset();
        });
      };
    });

    return () => {
      runtime.engine.voices.forEach((voice, idx) => {
        voice.onNoteOn = previousHandlers[idx] ?? null;
      });
    };
  }, [runtime]);

  // Apply loaded preset data to osc/lfo/filter state + runtime
  useEffect(() => {
    if (!activePresetData) return;
    const d = activePresetData;

    // Voices
    const voices = d.voices as Array<any> | undefined;
    if (voices && voices.length >= 2) {
      setOscState([
        {
          enabled: voices[0].enabled, waveform: voices[0].waveform, volume: voices[0].volume,
          detune: voices[0].detune, unisonCount: voices[0].unisonCount,
          unisonDetune: voices[0].unisonDetune, unisonSpread: voices[0].unisonSpread,
        },
        {
          enabled: voices[1].enabled, waveform: voices[1].waveform, volume: voices[1].volume,
          detune: voices[1].detune, unisonCount: voices[1].unisonCount,
          unisonDetune: voices[1].unisonDetune, unisonSpread: voices[1].unisonSpread,
        },
      ]);
      if (runtime) {
        voices.forEach((v: any, i: number) => {
          const voice = runtime.engine.voices[i];
          if (!voice) return;
          voice.setEnabled(v.enabled);
          voice.setWaveform(v.waveform);
          voice.setVolume(v.volume);
          voice.setDetune(v.detune);
          voice.setUnisonCount(v.unisonCount);
          voice.setUnisonDetune(v.unisonDetune);
          voice.setUnisonSpread(v.unisonSpread / 100);
          if (v.adsr) Object.assign(voice.adsr, v.adsr);
        });
      }
    }

    // Filter
    const filter = d.filter as any;
    if (filter) {
      setFilterEnabled(filter.enabled);
      setFilterType(filter.type);
      if (runtime) {
        runtime.engine.setFilterEnabled(filter.enabled);
        runtime.engine.setFilterType(filter.type);
        runtime.engine.setFilterCutoff(filter.cutoff);
        runtime.engine.setFilterResonance(filter.resonance);
      }
    }

    // LFOs — d.lfos is [2][4] array
    const lfos = d.lfos as any[][] | undefined;
    if (lfos && lfos.length >= 2) {
      setLfoState([
        lfos[0].map((lfo: any) => ({
          waveform: lfo.waveform, rate: lfo.rate, depthPct: lfo.depth * 100,
          phase: lfo.phase, delay: lfo.delay, fadeIn: lfo.fadeIn,
          bpmSync: lfo.bpmSync, bpm: lfo.bpm, syncDivision: lfo.syncDivision,
          oneShot: lfo.oneShot, targets: [...lfo.targets],
        })),
        lfos[1].map((lfo: any) => ({
          waveform: lfo.waveform, rate: lfo.rate, depthPct: lfo.depth * 100,
          phase: lfo.phase, delay: lfo.delay, fadeIn: lfo.fadeIn,
          bpmSync: lfo.bpmSync, bpm: lfo.bpm, syncDivision: lfo.syncDivision,
          oneShot: lfo.oneShot, targets: [...lfo.targets],
        })),
      ] as [LfoUIState[], LfoUIState[]]);
      if (runtime) {
        lfos.forEach((oscLfos, oscIdx) => {
          oscLfos.forEach((lfo: any, lfoIdx: number) => {
            const rLfo = runtime.lfos[oscIdx]?.[lfoIdx];
            if (!rLfo) return;
            rLfo.waveform = lfo.waveform;
            rLfo.rate = lfo.rate;
            rLfo.depth = lfo.depth;
            rLfo.phase = lfo.phase;
            rLfo.delay = lfo.delay;
            rLfo.fadeIn = lfo.fadeIn;
            rLfo.bpmSync = lfo.bpmSync;
            rLfo.bpm = lfo.bpm;
            rLfo.syncDivision = lfo.syncDivision;
            rLfo.oneShot = lfo.oneShot;
            rLfo.targets.clear();
            lfo.targets.forEach((t: any) => rLfo.addTarget(t));
          });
        });
      }
    }
  }, [activePresetData, resetCount]);

  const applyVoice = (index: 0 | 1, updater: (voice: SynthRuntime['engine']['voices'][0]) => void) => {
    if (!runtime) return;
    updater(runtime.engine.voices[index]);
  };

  const targetKey = (target: LFOTarget, osc: 1 | 2) => (target === 'volume' || target === 'filter' ? target : `${target}-${osc}`);

  const isTargetValidForDrag = (target: LFOTarget, osc: 1 | 2) => {
    if (!dragSource) return false;
    if (target === 'volume' || target === 'filter') return true;
    return dragSource.osc === osc;
  };

  const dropBinding = (target: LFOTarget, osc: 1 | 2) => {
    const key = targetKey(target, osc);
    const active = isTargetValidForDrag(target, osc);
    const hover = hoverTarget === key;

    return {
      active,
      hover,
      onDragOver: (e: React.DragEvent<HTMLElement>) => {
        if (!active) return;
        e.preventDefault();
        setHoverTarget(key);
      },
      onDragLeave: () => {
        setHoverTarget((prev) => (prev === key ? null : prev));
      },
      onDrop: (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        if (!dragSource || !active) return;
        toggleLfoTarget(dragSource.osc, dragSource.lfo, target);
        setHoverTarget(null);
        setDragSource(null);
      },
    };
  };

  const renderLfoSection = (osc: 1 | 2): ReactNode => {
    const oscIndex = osc - 1;
    const activeTab = activeLfoTab[oscIndex];

    return (
      <div className="lfo-section" id={`lfo-section-${osc}`}>
        <div className="lfo-tabs">
          {[1, 2, 3, 4].map((lfoN) => (
            <button
              key={`lfo-tab-${osc}-${lfoN}`}
              className={`lfo-tab${activeTab === lfoN ? ' active' : ''}`}
              data-lfo-osc={osc}
              data-lfo-idx={lfoN}
              onClick={() => setActiveLfoTab((prev) => {
                const next = [...prev] as [1 | 2 | 3 | 4, 1 | 2 | 3 | 4];
                next[oscIndex] = lfoN as 1 | 2 | 3 | 4;
                return next;
              })}
            >
              LFO {lfoN}
            </button>
          ))}
        </div>

        {[1, 2, 3, 4].map((lfoN) => {
          const panel = lfoState[oscIndex][lfoN - 1];
          return (
            <div key={`lfo-panel-${osc}-${lfoN}`} className={`lfo-panel${activeTab === lfoN ? ' active' : ''}`} id={`lfo-panel-${osc}-${lfoN}`}>
              <div className="lfo-header">
                <span className="lfo-label">LFO {lfoN}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className={`lfo-vis-toggle ${showCables ? 'on' : 'off'}`}
                    onClick={() => setShowCables((prev) => !prev)}
                  >
                    VIS
                  </button>
                  <div
                    className="lfo-mod-chip"
                    id={`lfo-chip-${osc}-${lfoN}`}
                    draggable={true}
                    data-lfo-osc={osc}
                    data-lfo-idx={lfoN}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'link';
                      e.dataTransfer.setData('text/plain', `${osc},${lfoN}`);
                      setDragSource({ osc, lfo: lfoN as 1 | 2 | 3 | 4 });
                    }}
                    onDragEnd={() => {
                      setDragSource(null);
                      setHoverTarget(null);
                    }}
                  >
                    MOD
                  </div>
                </div>
              </div>

              <div className="controls">
                <div className="control-group">
                  <label>Waveform</label>
                  <select
                    id={`lfo-waveform-${osc}-${lfoN}`}
                    value={panel.waveform}
                    onChange={(e) => {
                      const waveform = e.target.value as LFOWaveform;
                      setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { waveform });
                      applyLfo(oscIndex as 0 | 1, lfoN - 1, { waveform });
                    }}
                  >
                    <option value="sine">Sine</option>
                    <option value="triangle">Triangle</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                  </select>
                  <canvas className="waveform-preview" id={`lfo-waveform-${osc}-${lfoN}-preview`} width="120" height="30"></canvas>
                </div>
                <div className="control-group">
                  <label>Rate (Hz)</label>
                  <KnobControl
                    id={`lfo-rate-${osc}-${lfoN}`}
                    min={0.05}
                    max={20}
                    step={0.05}
                    value={panel.rate}
                    disabled={panel.bpmSync}
                    displayValue={panel.rate.toFixed(2)}
                    onValueChange={(rate) => {
                      setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { rate });
                      applyLfo(oscIndex as 0 | 1, lfoN - 1, { rate });
                    }}
                  />
                </div>
                <div className="control-group">
                  <label>Depth</label>
                  <KnobControl
                    id={`lfo-depth-${osc}-${lfoN}`}
                    min={0}
                    max={100}
                    step={1}
                    value={panel.depthPct}
                    displayValue={`${Math.round(panel.depthPct)}%`}
                    onValueChange={(depthPct) => {
                      setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { depthPct });
                      applyLfo(oscIndex as 0 | 1, lfoN - 1, { depthPct });
                    }}
                  />
                </div>
              </div>

              <div className="controls">
                <div className="control-group">
                  <label>Phase</label>
                  <KnobControl
                    id={`lfo-phase-${osc}-${lfoN}`}
                    min={0}
                    max={360}
                    step={1}
                    value={panel.phase}
                    displayValue={`${Math.round(panel.phase)}°`}
                    onValueChange={(phase) => {
                      setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { phase });
                      applyLfo(oscIndex as 0 | 1, lfoN - 1, { phase });
                    }}
                  />
                </div>
                <div className="control-group">
                  <label>Delay (s)</label>
                  <KnobControl
                    id={`lfo-delay-${osc}-${lfoN}`}
                    min={0}
                    max={5}
                    step={0.05}
                    value={panel.delay}
                    displayValue={panel.delay.toFixed(2)}
                    onValueChange={(delay) => {
                      setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { delay });
                      applyLfo(oscIndex as 0 | 1, lfoN - 1, { delay });
                    }}
                  />
                </div>
                <div className="control-group">
                  <label>Fade In (s)</label>
                  <KnobControl
                    id={`lfo-fadein-${osc}-${lfoN}`}
                    min={0}
                    max={5}
                    step={0.05}
                    value={panel.fadeIn}
                    displayValue={panel.fadeIn.toFixed(2)}
                    onValueChange={(fadeIn) => {
                      setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { fadeIn });
                      applyLfo(oscIndex as 0 | 1, lfoN - 1, { fadeIn });
                    }}
                  />
                </div>
              </div>

              <div className="lfo-sync-row">
                <button
                  className={`lfo-sync-toggle ${panel.bpmSync ? 'on' : 'off'}`}
                  id={`lfo-sync-${osc}-${lfoN}`}
                  onClick={() => {
                    const bpmSync = !panel.bpmSync;
                    setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { bpmSync });
                    applyLfo(oscIndex as 0 | 1, lfoN - 1, { bpmSync });
                  }}
                >
                  SYNC
                </button>
                <input
                  type="number"
                  className="lfo-bpm-input"
                  id={`lfo-bpm-${osc}-${lfoN}`}
                  value={panel.bpm}
                  min="20"
                  max="300"
                  disabled={!panel.bpmSync}
                  onChange={(e) => {
                    const bpm = parseFloat(e.target.value) || 120;
                    setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { bpm });
                    applyLfo(oscIndex as 0 | 1, lfoN - 1, { bpm });
                  }}
                />
                <select
                  className="lfo-division-select"
                  id={`lfo-division-${osc}-${lfoN}`}
                  value={panel.syncDivision}
                  disabled={!panel.bpmSync}
                  onChange={(e) => {
                    const syncDivision = e.target.value as LFODivision;
                    setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { syncDivision });
                    applyLfo(oscIndex as 0 | 1, lfoN - 1, { syncDivision });
                  }}
                >
                  {LFO_DIVISIONS.map((division) => (
                    <option key={`division-${osc}-${lfoN}-${division}`} value={division}>{division}</option>
                  ))}
                </select>
                <button
                  className={`lfo-oneshot-toggle ${panel.oneShot ? 'on' : 'off'}`}
                  id={`lfo-oneshot-${osc}-${lfoN}`}
                  onClick={() => {
                    const oneShot = !panel.oneShot;
                    setLfoPatch(oscIndex as 0 | 1, lfoN - 1, { oneShot });
                    applyLfo(oscIndex as 0 | 1, lfoN - 1, { oneShot });
                  }}
                >
                  1-SHOT
                </button>
              </div>

              <div className="lfo-targets" id={`lfo-targets-${osc}-${lfoN}`}>
                {OSC_TARGET_OPTIONS.map(({ target, label }) => (
                  <button
                    key={`${osc}-${lfoN}-target-${target}`}
                    className={`lfo-oneshot-toggle ${panel.targets.includes(target) ? 'on' : 'off'}`}
                    onClick={() => toggleLfoTarget(osc, lfoN as 1 | 2 | 3 | 4, target)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className={`lfo-oneshot-toggle ${panel.targets.includes('volume') ? 'on' : 'off'}`}
                  onClick={() => toggleLfoTarget(osc, lfoN as 1 | 2 | 3 | 4, 'volume')}
                >
                  Master Vol
                </button>
                {panel.targets.map((target) => {
                  const labelMap: Record<LFOTarget, string> = {
                    filter: 'Filter',
                    volume: 'Master Vol',
                    'osc-volume': `Osc ${osc} Vol`,
                    'osc-detune': `Osc ${osc} Detune`,
                    'osc-unison-detune': `Osc ${osc} UniDet`,
                    'osc-unison-spread': `Osc ${osc} Spread`,
                  };
                  const label = labelMap[target];
                  return (
                    <span key={`${osc}-${lfoN}-${target}`} className="lfo-target-badge">
                      {label}{' '}
                      <span className="badge-remove" onClick={() => toggleLfoTarget(osc, lfoN as 1 | 2 | 3 | 4, target)}>
                        ×
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const filterDrop = dropBinding('filter', 1);
  const masterVolumeDrop = dropBinding('volume', 1);

  return (
    <div className={`main-page${active ? ' active' : ''}`} id="page-osc">
      <div className="synth-body">
        <canvas id="waveform-canvas" width="696" height="80"></canvas>

        <div className="osc-tabs">
          <div className={`osc-tab${activeOsc === 1 ? ' active' : ''}`} data-osc="1" onClick={() => setActiveOsc(1)}>
            <span className="osc-tab-label">Osc 1</span>
            <button
              className={`osc-toggle ${oscState[0].enabled ? 'on' : 'off'}`}
              id="toggle1"
              onClick={(e) => {
                e.stopPropagation();
                const enabled = !oscState[0].enabled;
                setVoicePatch(0, { enabled });
                applyVoice(0, (v) => v.setEnabled(enabled));
              }}
            >
              {oscState[0].enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className={`osc-tab${activeOsc === 2 ? ' active' : ''}`} data-osc="2" onClick={() => setActiveOsc(2)}>
            <span className="osc-tab-label">Osc 2</span>
            <button
              className={`osc-toggle ${oscState[1].enabled ? 'on' : 'off'}`}
              id="toggle2"
              onClick={(e) => {
                e.stopPropagation();
                const enabled = !oscState[1].enabled;
                setVoicePatch(1, { enabled });
                applyVoice(1, (v) => v.setEnabled(enabled));
              }}
            >
              {oscState[1].enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <OscSection
          n={1}
          state={oscState[0]}
          hidden={activeOsc !== 1}
          lfoSection={renderLfoSection(1)}
          dropForTarget={(target) => dropBinding(target, 1)}
          onWaveform={(value) => {
            setVoicePatch(0, { waveform: value });
            applyVoice(0, (v) => v.setWaveform(value));
          }}
          onVolume={(value) => {
            setVoicePatch(0, { volume: value });
            applyVoice(0, (v) => v.setVolume(value));
          }}
          onDetuneInput={(value) => {
            setVoicePatch(0, { detune: value });
            applyVoice(0, (v) => v.setDetune(value));
          }}
          onUnisonCount={(value) => {
            setVoicePatch(0, { unisonCount: value });
            applyVoice(0, (v) => v.setUnisonCount(value));
          }}
          onUnisonDetune={(value) => {
            setVoicePatch(0, { unisonDetune: value });
            applyVoice(0, (v) => v.setUnisonDetune(value));
          }}
          onUnisonSpread={(value) => {
            setVoicePatch(0, { unisonSpread: value });
            applyVoice(0, (v) => v.setUnisonSpread(value / 100));
          }}
        />

        <OscSection
          n={2}
          state={oscState[1]}
          hidden={activeOsc !== 2}
          lfoSection={renderLfoSection(2)}
          dropForTarget={(target) => dropBinding(target, 2)}
          onWaveform={(value) => {
            setVoicePatch(1, { waveform: value });
            applyVoice(1, (v) => v.setWaveform(value));
          }}
          onVolume={(value) => {
            setVoicePatch(1, { volume: value });
            applyVoice(1, (v) => v.setVolume(value));
          }}
          onDetuneInput={(value) => {
            setVoicePatch(1, { detune: value });
            applyVoice(1, (v) => v.setDetune(value));
          }}
          onUnisonCount={(value) => {
            setVoicePatch(1, { unisonCount: value });
            applyVoice(1, (v) => v.setUnisonCount(value));
          }}
          onUnisonDetune={(value) => {
            setVoicePatch(1, { unisonDetune: value });
            applyVoice(1, (v) => v.setUnisonDetune(value));
          }}
          onUnisonSpread={(value) => {
            setVoicePatch(1, { unisonSpread: value });
            applyVoice(1, (v) => v.setUnisonSpread(value / 100));
          }}
        />

        <div
          className={`filter-section${filterEnabled ? '' : ' disabled'}${filterDrop.active ? ' drop-target-active' : ''}${filterDrop.hover ? ' drop-target-hover' : ''}`}
          id="filter-section"
          data-drop-target="filter"
          onDragOver={filterDrop.onDragOver}
          onDragLeave={filterDrop.onDragLeave}
          onDrop={filterDrop.onDrop}
        >
          <div className="controls">
            <div className="control-group">
              <label>Filter</label>
              <div className="filter-header">
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => {
                    const type = e.target.value as BiquadFilterType;
                    setFilterType(type);
                    if (runtime) runtime.engine.setFilterType(type);
                  }}
                >
                  <option value="lowpass">Low Pass</option>
                  <option value="highpass">High Pass</option>
                  <option value="bandpass">Band Pass</option>
                </select>
                <button
                  className={`filter-toggle ${filterEnabled ? 'on' : 'off'}`}
                  id="filter-toggle"
                  onClick={() => {
                    const enabled = !filterEnabled;
                    setFilterEnabled(enabled);
                    if (runtime) runtime.engine.setFilterEnabled(enabled);
                  }}
                >
                  {filterEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
          <canvas className="filter-canvas" id="filter-canvas" width="560" height="120"></canvas>
          <div className="filter-values" id="filter-values"></div>
        </div>

        <div
          className={`controls master-controls${masterVolumeDrop.active ? ' drop-target-active' : ''}${masterVolumeDrop.hover ? ' drop-target-hover' : ''}`}
          id="master-volume-section"
          data-drop-target="volume"
          onDragOver={masterVolumeDrop.onDragOver}
          onDragLeave={masterVolumeDrop.onDragLeave}
          onDrop={masterVolumeDrop.onDrop}
        />

        <LfoCableOverlay
          lfoState={lfoState}
          activeOsc={activeOsc}
          activeLfoTab={activeLfoTab}
          showCables={showCables}
        />
      </div>
    </div>
  );
}
