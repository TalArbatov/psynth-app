import { createADSRGraph } from '../../modules/adsr-graph.js';
import { createEQGraph } from '../../modules/eq-graph.js';
import { createPianoKeyboard } from '../../modules/piano-keyboard.js';
import { createWaveformDisplay } from '../../modules/waveform-display.js';
import { byCanvasId, byId } from './dom.js';
import type { SynthRuntime } from './runtime.js';

/**
 * Creates visual/audio interaction views and returns drawables used by the
 * animation loop and sync handlers.
 */
export function createSynthViews(runtime: SynthRuntime) {
  const { sync, engine, fxChain } = runtime;

  const adsrGraphs = [
    createADSRGraph(byCanvasId('adsr1-canvas'), byId('adsr1-values'), engine.voices[0].adsr, () => {
      const a = engine.voices[0].adsr;
      sync.send({ t: 'adsr', n: 0, a: a.a, d: a.d, s: a.s, r: a.r });
    }),
    createADSRGraph(byCanvasId('adsr2-canvas'), byId('adsr2-values'), engine.voices[1].adsr, () => {
      const a = engine.voices[1].adsr;
      sync.send({ t: 'adsr', n: 1, a: a.a, d: a.d, s: a.s, r: a.r });
    }),
  ];

  const keyboard = createPianoKeyboard(byCanvasId('keyboard'), {
    onNoteOn: (freq) => {
      engine.noteOn(freq);
      sync.send({ t: 'noteOn', f: freq });
    },
    onNoteOff: (freq) => {
      engine.noteOff(freq);
      sync.send({ t: 'noteOff', f: freq });
    },
    isEnabled: () => runtime.state.keyboardEnabled,
  });

  const waveform = createWaveformDisplay(byCanvasId('waveform-canvas'), engine.analyser);
  const eqGraph = createEQGraph(byCanvasId('fx-eq-canvas'), fxChain.eq);
  const drawList = [waveform, keyboard, eqGraph, ...adsrGraphs];

  return { adsrGraphs, keyboard, drawList };
}

export type SynthViews = ReturnType<typeof createSynthViews>;

