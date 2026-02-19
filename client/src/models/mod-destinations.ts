import type { AudioEngine } from '../modules/audio-engine.js';
import type { ModDestination, ModSource, Patch } from './patch.js';

export const MOD_SOURCE_COLORS: Record<ModSource, string> = {
  lfo1: '#00d2ff',
  lfo2: '#ff6b9d',
  lfo3: '#ffd93d',
  lfo4: '#6bff6b',
  env1: '#b388ff',
  env2: '#ff8a65',
};

export const MOD_DESTINATION_LABELS: Record<ModDestination, string> = {
  'osc1-level': 'Osc 1 Level',
  'osc1-detune': 'Osc 1 Detune',
  'osc1-unison-detune': 'Osc 1 Uni Det',
  'osc1-unison-spread': 'Osc 1 Spread',
  'osc2-level': 'Osc 2 Level',
  'osc2-detune': 'Osc 2 Detune',
  'osc2-unison-detune': 'Osc 2 Uni Det',
  'osc2-unison-spread': 'Osc 2 Spread',
  'filter-cutoff': 'Filter Cutoff',
  'master-volume': 'Master Volume',
  'fx-sat-drive': 'Sat Drive',
  'fx-sat-mix': 'Sat Mix',
  'fx-chorus-rate': 'Chorus Rate',
  'fx-chorus-depth': 'Chorus Depth',
  'fx-chorus-mix': 'Chorus Mix',
  'fx-delay-time': 'Delay Time',
  'fx-delay-feedback': 'Delay Feedback',
  'fx-delay-mix': 'Delay Mix',
  'fx-reverb-size': 'Reverb Size',
  'fx-reverb-mix': 'Reverb Mix',
  'fx-comp-threshold': 'Comp Threshold',
  'fx-comp-ratio': 'Comp Ratio',
};

/**
 * Apply computed modulation values to the audio engine.
 * Each value in modValues is the summed modulation offset for that destination.
 */
export function applyModToEngine(
  engine: AudioEngine,
  patch: Patch,
  modValues: Map<ModDestination, number>,
): void {
  for (const [dest, mod] of modValues) {
    switch (dest) {
      case 'osc1-level': {
        const base = patch.oscillators[0].level;
        engine.voices[0].applyModulatedVolume(Math.max(0, Math.min(1, base * (1 + mod))));
        break;
      }
      case 'osc2-level': {
        const base = patch.oscillators[1].level;
        engine.voices[1].applyModulatedVolume(Math.max(0, Math.min(1, base * (1 + mod))));
        break;
      }
      case 'osc1-detune': {
        const base = patch.oscillators[0].fine;
        engine.voices[0].applyModulatedDetune(base + mod * 100);
        break;
      }
      case 'osc2-detune': {
        const base = patch.oscillators[1].fine;
        engine.voices[1].applyModulatedDetune(base + mod * 100);
        break;
      }
      case 'osc1-unison-detune': {
        const base = patch.oscillators[0].unisonDetune;
        engine.voices[0].applyModulatedUnisonDetune(Math.max(0, base + mod * 50));
        break;
      }
      case 'osc2-unison-detune': {
        const base = patch.oscillators[1].unisonDetune;
        engine.voices[1].applyModulatedUnisonDetune(Math.max(0, base + mod * 50));
        break;
      }
      case 'osc1-unison-spread': {
        const basePct = patch.oscillators[0].unisonSpread;
        engine.voices[0].applyModulatedUnisonSpread(Math.max(0, Math.min(1, basePct / 100 + mod * 0.5)));
        break;
      }
      case 'osc2-unison-spread': {
        const basePct = patch.oscillators[1].unisonSpread;
        engine.voices[1].applyModulatedUnisonSpread(Math.max(0, Math.min(1, basePct / 100 + mod * 0.5)));
        break;
      }
      case 'filter-cutoff': {
        engine.applyModulatedCutoff(engine.cutoff * Math.pow(2, mod * 3));
        break;
      }
      case 'master-volume': {
        const base = patch.global.masterVolume;
        const modVol = Math.max(0, Math.min(1, base * (1 + mod)));
        engine.masterGain.gain.setValueAtTime(modVol, engine.audioCtx.currentTime);
        break;
      }
      // FX destinations are applied via the fxChain, but we need
      // runtime access - handled by the animation loop caller
      default:
        break;
    }
  }
}
