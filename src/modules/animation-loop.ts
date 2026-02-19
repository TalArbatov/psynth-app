/**
 * requestAnimationFrame loop that drives LFO modulation computation
 * (filter cutoff + master volume) and redraws all visual components.
 */

import type { AudioEngine } from './audio-engine.js';
import type { LFO } from './lfo.js';
import type { Drawable } from './types.js';
import { getKnob } from './knob-registry.js';

/**
 * Start the animation loop.
 * @param engine               Audio engine
 * @param lfos                 2D LFO array [oscIndex][lfoIndex]
 * @param drawList             Mutable list of drawables (filter graphs are added asynchronously)
 * @param getBaseMasterVolume  Returns the un-modulated master volume set by the user
 */
export function startAnimationLoop(
  engine: AudioEngine,
  lfos: LFO[][],
  drawList: Drawable[],
  getBaseMasterVolume: () => number
): void {
  const masterVolumeVal = document.getElementById('master-volume-val')!;
  const readBaseValue = (id: string, fallback: number): number => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return fallback;
    const parsed = Number.parseFloat(el.value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  function animate(): void {
    requestAnimationFrame(animate);

    const now = performance.now() / 1000;
    let masterVolMod = 0;
    let filterMod = 0;
    let hasFilterTarget = false;

    for (let i = 0; i < 2; i++) {
      const voice = engine.voices[i];
      let oscVolMod = 0;
      let oscDetuneMod = 0;
      let oscUnisonDetuneMod = 0;
      let oscUnisonSpreadMod = 0;
      let hasOscVolumeTarget = false;
      let hasOscDetuneTarget = false;
      let hasOscUnisonDetuneTarget = false;
      let hasOscUnisonSpreadTarget = false;
      for (let j = 0; j < 4; j++) {
        const lfo = lfos[i][j];
        const val = lfo.getValue(now);
        if (lfo.hasTarget('filter')) {
          hasFilterTarget = true;
          filterMod += val;
        }
        if (lfo.hasTarget('volume')) masterVolMod += val;
        if (lfo.hasTarget('osc-volume')) {
          hasOscVolumeTarget = true;
          oscVolMod += val;
        }
        if (lfo.hasTarget('osc-detune')) {
          hasOscDetuneTarget = true;
          oscDetuneMod += val;
        }
        if (lfo.hasTarget('osc-unison-detune')) {
          hasOscUnisonDetuneTarget = true;
          oscUnisonDetuneMod += val;
        }
        if (lfo.hasTarget('osc-unison-spread')) {
          hasOscUnisonSpreadTarget = true;
          oscUnisonSpreadMod += val;
        }
      }

      // Modulate oscillator params from base control values so modulation never
      // accumulates and tracks what the user set on knobs.
      const oscN = i + 1;
      const baseVolume = readBaseValue(`volume${oscN}`, voice.volume);
      const baseDetune = readBaseValue(`detune${oscN}`, voice.detune);
      const baseUnisonDetune = readBaseValue(`unison-detune${oscN}`, voice.unisonDetune);
      const baseUnisonSpreadPct = readBaseValue(`unison-spread${oscN}`, voice.unisonSpread * 100);

      const modulatedVoiceVolume = Math.max(0, Math.min(1, baseVolume * (1 + oscVolMod)));
      const modulatedDetune = baseDetune + oscDetuneMod * 100;
      const modulatedUnisonDetune = Math.max(0, baseUnisonDetune + oscUnisonDetuneMod * 50);
      const modulatedUnisonSpreadPct = Math.max(0, Math.min(100, baseUnisonSpreadPct + oscUnisonSpreadMod * 50));

      voice.applyModulatedVolume(modulatedVoiceVolume);
      voice.applyModulatedDetune(modulatedDetune);
      voice.applyModulatedUnisonDetune(modulatedUnisonDetune);
      voice.applyModulatedUnisonSpread(modulatedUnisonSpreadPct / 100);

      // Reflect modulation on the corresponding knobs when targeted.
      getKnob(`volume${oscN}`)?.setValue(hasOscVolumeTarget ? modulatedVoiceVolume : baseVolume);
      getKnob(`detune${oscN}`)?.setValue(hasOscDetuneTarget ? modulatedDetune : baseDetune);
      getKnob(`unison-detune${oscN}`)?.setValue(hasOscUnisonDetuneTarget ? modulatedUnisonDetune : baseUnisonDetune);
      getKnob(`unison-spread${oscN}`)?.setValue(hasOscUnisonSpreadTarget ? modulatedUnisonSpreadPct : baseUnisonSpreadPct);
    }

    // Apply global filter modulation (accumulated from both oscillators' LFOs)
    if (hasFilterTarget) {
      engine.applyModulatedCutoff(engine.cutoff * Math.pow(2, filterMod * 3));
    } else {
      engine.applyModulatedCutoff(engine.cutoff);
    }

    const baseMasterVolume = getBaseMasterVolume();
    const modVol = Math.max(0, Math.min(1, baseMasterVolume * (1 + masterVolMod)));
    engine.masterGain.gain.setValueAtTime(modVol, engine.audioCtx.currentTime);
    getKnob('master-volume')?.setValue(modVol);
    masterVolumeVal.textContent = modVol.toFixed(2);

    for (const item of drawList) {
      item.draw();
    }
  }

  animate();
}
