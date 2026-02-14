export function createEQ(audioCtx) {
  const input = audioCtx.createGain();
  const output = audioCtx.createGain();
  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();

  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 20;
  hp.Q.value = 0.707;

  const band = audioCtx.createBiquadFilter();
  band.type = 'peaking';
  band.frequency.value = 1000;
  band.gain.value = 0;
  band.Q.value = 1;

  const shelf = audioCtx.createBiquadFilter();
  shelf.type = 'highshelf';
  shelf.frequency.value = 8000;
  shelf.gain.value = 0;

  // Dry path
  input.connect(dryGain).connect(output);
  // Wet path
  input.connect(hp).connect(band).connect(shelf).connect(wetGain).connect(output);

  // Start bypassed
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  return {
    input,
    output,
    setEnabled(on) {
      dryGain.gain.setValueAtTime(on ? 0 : 1, audioCtx.currentTime);
      wetGain.gain.setValueAtTime(on ? 1 : 0, audioCtx.currentTime);
    },
    set(params) {
      if (params.hpFreq !== undefined) {
        hp.frequency.setValueAtTime(params.hpFreq, audioCtx.currentTime);
      }
      if (params.bandFreq !== undefined) {
        band.frequency.setValueAtTime(params.bandFreq, audioCtx.currentTime);
      }
      if (params.bandGain !== undefined) {
        band.gain.setValueAtTime(params.bandGain, audioCtx.currentTime);
      }
      if (params.bandQ !== undefined) {
        band.Q.setValueAtTime(params.bandQ, audioCtx.currentTime);
      }
      if (params.shelfFreq !== undefined) {
        shelf.frequency.setValueAtTime(params.shelfFreq, audioCtx.currentTime);
      }
      if (params.shelfGain !== undefined) {
        shelf.gain.setValueAtTime(params.shelfGain, audioCtx.currentTime);
      }
    }
  };
}
