export function createSaturation(audioCtx) {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();

  const driveGain = audioCtx.createGain();
  const waveshaper = audioCtx.createWaveShaper();
  const toneFilter = audioCtx.createBiquadFilter();
  const outputGain = audioCtx.createGain();

  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 4000;

  driveGain.gain.value = 1;
  outputGain.gain.value = 0.5;

  // Dry path
  input.connect(dryGain).connect(output);
  // Wet path
  input.connect(driveGain).connect(waveshaper).connect(toneFilter).connect(outputGain).connect(wetGain).connect(output);

  // Start bypassed
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  let currentType = 'soft';
  waveshaper.curve = makeSoftCurve();
  waveshaper.oversample = '4x';

  function makeSoftCurve() {
    const n = 8192;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x);
    }
    return curve;
  }

  function makeHardCurve() {
    const n = 8192;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.max(-1, Math.min(1, x * 2));
    }
    return curve;
  }

  function makeWaveCurve() {
    const n = 8192;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = (Math.PI + 3.5) * x / (Math.PI + 3.5 * Math.abs(x));
    }
    return curve;
  }

  return {
    input,
    output,
    setEnabled(on) {
      dryGain.gain.setValueAtTime(on ? 0 : 1, audioCtx.currentTime);
      wetGain.gain.setValueAtTime(on ? 1 : 0, audioCtx.currentTime);
    },
    set(params) {
      if (params.type !== undefined && params.type !== currentType) {
        currentType = params.type;
        if (currentType === 'soft') waveshaper.curve = makeSoftCurve();
        else if (currentType === 'hard') waveshaper.curve = makeHardCurve();
        else waveshaper.curve = makeWaveCurve();
      }
      if (params.drive !== undefined) {
        driveGain.gain.setValueAtTime(params.drive, audioCtx.currentTime);
      }
      if (params.output !== undefined) {
        outputGain.gain.setValueAtTime(params.output, audioCtx.currentTime);
      }
      if (params.tone !== undefined) {
        toneFilter.frequency.setValueAtTime(params.tone, audioCtx.currentTime);
      }
      if (params.mix !== undefined) {
        dryGain.gain.setValueAtTime(1 - params.mix, audioCtx.currentTime);
        wetGain.gain.setValueAtTime(params.mix, audioCtx.currentTime);
      }
    }
  };
}
