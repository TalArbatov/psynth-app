import type { ModDestination, ModSource } from './patch.js';

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
