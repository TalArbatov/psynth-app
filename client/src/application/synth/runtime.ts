import { AudioEngine } from '../../modules/audio-engine.js';
import { createFXChain } from '../../modules/fx/fx-chain.js';
import { LFO } from '../../modules/lfo.js';
import { createSync } from '../../modules/sync.js';
import { API_BASE_URL } from '../../config/api.js';

/**
 * Runtime services and mutable app state.
 * Keeps audio/sync construction separate from UI wiring.
 */
export function createSynthRuntime() {
  const sync = createSync(API_BASE_URL);
  const engine = new AudioEngine(2);
  const fxChain = createFXChain(engine.audioCtx);

  engine.masterGain.disconnect();
  engine.masterGain.connect(fxChain.input);
  fxChain.output.connect(engine.analyser);

  const lfos = [0, 1].map(() => Array.from({ length: 4 }, () => new LFO()));
  const state = { baseMasterVolume: 0.7 };

  engine.voices[0].setWaveform('sawtooth');
  engine.voices[1].setWaveform('triangle');

  return { sync, engine, fxChain, lfos, state };
}

export type SynthRuntime = ReturnType<typeof createSynthRuntime>;

