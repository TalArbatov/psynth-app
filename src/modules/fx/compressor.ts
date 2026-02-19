import type { CompressorParams, EffectUnit } from '../types.js';

export function createCompressor(audioCtx: AudioContext): EffectUnit<CompressorParams> {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();

  const comp = audioCtx.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;

  const makeupGain = audioCtx.createGain();
  makeupGain.gain.value = 1;

  // Dry path
  input.connect(dryGain).connect(output);
  // Wet path
  input.connect(comp).connect(makeupGain).connect(wetGain).connect(output);

  // Start bypassed
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  return {
    input,
    output,
    setEnabled(on: boolean) {
      dryGain.gain.setValueAtTime(on ? 0 : 1, audioCtx.currentTime);
      wetGain.gain.setValueAtTime(on ? 1 : 0, audioCtx.currentTime);
    },
    set(params: CompressorParams) {
      if (params.threshold !== undefined) {
        comp.threshold.setValueAtTime(params.threshold, audioCtx.currentTime);
      }
      if (params.ratio !== undefined) {
        comp.ratio.setValueAtTime(params.ratio, audioCtx.currentTime);
      }
      if (params.attack !== undefined) {
        comp.attack.setValueAtTime(params.attack, audioCtx.currentTime);
      }
      if (params.release !== undefined) {
        comp.release.setValueAtTime(params.release, audioCtx.currentTime);
      }
      if (params.makeup !== undefined) {
        makeupGain.gain.setValueAtTime(Math.pow(10, params.makeup / 20), audioCtx.currentTime);
      }
    }
  };
}
