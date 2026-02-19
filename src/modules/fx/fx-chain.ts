import { createSaturation } from './saturation.js';
import { createEQ } from './eq.js';
import { createChorus } from './chorus.js';
import { createDelay } from './delay.js';
import { createReverb } from './reverb.js';
import { createCompressor } from './compressor.js';
import type {
  ChorusParams,
  CompressorParams,
  DelayParams,
  EffectUnit,
  EQUnit,
  ReverbParams,
  SaturationParams
} from '../types.js';

export interface FXChain {
  input: GainNode;
  output: GainNode;
  saturation: EffectUnit<SaturationParams>;
  eq: EQUnit;
  chorus: EffectUnit<ChorusParams>;
  delay: EffectUnit<DelayParams>;
  reverb: EffectUnit<ReverbParams>;
  compressor: EffectUnit<CompressorParams>;
}

export function createFXChain(audioCtx: AudioContext): FXChain {
  const saturation = createSaturation(audioCtx);
  const eq = createEQ(audioCtx);
  const chorus = createChorus(audioCtx);
  const delay = createDelay(audioCtx);
  const reverb = createReverb(audioCtx);
  const compressor = createCompressor(audioCtx);

  // Chain: saturation → eq → chorus → delay → reverb → compressor
  saturation.output.connect(eq.input);
  eq.output.connect(chorus.input);
  chorus.output.connect(delay.input);
  delay.output.connect(reverb.input);
  reverb.output.connect(compressor.input);

  return {
    input: saturation.input,
    output: compressor.output,
    saturation,
    eq,
    chorus,
    delay,
    reverb,
    compressor
  };
}
