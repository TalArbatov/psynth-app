import type { SynthRuntime } from '../application/synth/runtime.js';

/**
 * Deep-compare two preset snapshots for equality.
 * Uses JSON.stringify — simple and sufficient since snapshots are already serializable.
 */
export function snapshotsEqual(a: Record<string, any>, b: Record<string, any>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Capture the current synthesizer state as a serializable JSON object.
 * Reads directly from the runtime's public properties.
 */
export function capturePresetSnapshot(runtime: SynthRuntime): Record<string, unknown> {
  const readDom = (id: string, fallback: number): number => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return isNaN(v) ? fallback : v;
  };

  const readSelect = (id: string, fallback: string): string => {
    const el = document.getElementById(id) as HTMLSelectElement | null;
    return el?.value ?? fallback;
  };

  const readToggle = (id: string): boolean => {
    const el = document.getElementById(id);
    return el?.classList.contains('on') ?? false;
  };

  const voices = runtime.engine.voices.map((v) => ({
    enabled: v.enabled,
    waveform: v.waveform,
    volume: v.volume,
    detune: v.detune,
    unisonCount: v.unisonCount,
    unisonDetune: v.unisonDetune,
    unisonSpread: v.unisonSpread,
    adsr: { ...v.adsr },
  }));

  const filter = {
    enabled: runtime.engine.filterEnabled,
    type: runtime.engine.filterType,
    cutoff: runtime.engine.cutoff,
    resonance: runtime.engine.resonance,
  };

  const lfos = runtime.lfos.map((oscLfos) =>
    oscLfos.map((lfo) => ({
      waveform: lfo.waveform,
      rate: lfo.rate,
      depth: lfo.depth,
      phase: lfo.phase,
      delay: lfo.delay,
      fadeIn: lfo.fadeIn,
      bpmSync: lfo.bpmSync,
      bpm: lfo.bpm,
      syncDivision: lfo.syncDivision,
      oneShot: lfo.oneShot,
      targets: [...lfo.targets],
    }))
  );

  const fx = {
    saturation: {
      enabled: readToggle('fx-saturation-toggle'),
      type: readSelect('fx-sat-type', 'soft'),
      drive: readDom('fx-sat-drive', 1),
      output: readDom('fx-sat-output', 0.5),
      tone: readDom('fx-sat-tone', 4000),
      mix: readDom('fx-sat-mix', 1),
    },
    eq: {
      enabled: readToggle('fx-eq-toggle'),
      hpFreq: readDom('fx-eq-hp', 20),
      bandFreq: readDom('fx-eq-band-freq', 1000),
      bandGain: readDom('fx-eq-band-gain', 0),
      bandQ: readDom('fx-eq-band-q', 1),
      shelfFreq: readDom('fx-eq-shelf-freq', 8000),
      shelfGain: readDom('fx-eq-shelf-gain', 0),
    },
    chorus: {
      enabled: readToggle('fx-chorus-toggle'),
      rate: readDom('fx-chorus-rate', 0.8),
      depth: readDom('fx-chorus-depth', 2),
      delay: readDom('fx-chorus-delay', 10),
      spread: readDom('fx-chorus-spread', 50),
      mix: readDom('fx-chorus-mix', 0.5),
    },
    delay: {
      enabled: readToggle('fx-delay-toggle'),
      time: readDom('fx-delay-time', 300),
      feedback: readDom('fx-delay-feedback', 0.3),
      mix: readDom('fx-delay-mix', 0.3),
      pingPong: readToggle('fx-delay-pp'),
      filterFreq: readDom('fx-delay-filter', 5000),
    },
    reverb: {
      enabled: readToggle('fx-reverb-toggle'),
      size: readDom('fx-reverb-size', 2),
      preDelay: readDom('fx-reverb-predelay', 10),
      damping: readDom('fx-reverb-damping', 8000),
      mix: readDom('fx-reverb-mix', 0.3),
    },
    compressor: {
      enabled: readToggle('fx-compressor-toggle'),
      threshold: readDom('fx-comp-threshold', -24),
      ratio: readDom('fx-comp-ratio', 4),
      attack: readDom('fx-comp-attack', 0.003),
      release: readDom('fx-comp-release', 0.25),
      makeup: readDom('fx-comp-makeup', 0),
    },
  };

  return {
    version: 1,
    masterVolume: runtime.state.baseMasterVolume,
    voices,
    filter,
    lfos,
    fx,
  };
}
