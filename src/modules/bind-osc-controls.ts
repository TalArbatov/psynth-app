/** Wires per-oscillator controls: toggle, waveform, volume, detune, unison, and filter. */

import type { AudioEngine } from './audio-engine.js';
import { createKnob } from './knob.js';
import { registerKnob } from './knob-registry.js';
import { createWaveformPreview } from './waveform-preview.js';

/**
 * Bind all UI controls for a single oscillator voice.
 * @param voiceIndex  0-based voice index
 * @param prefix      DOM ID prefix ("osc1" or "osc2")
 * @param engine      Audio engine instance
 */
export function bindOscControls(voiceIndex: number, prefix: string, engine: AudioEngine): void {
  const voice = engine.voices[voiceIndex];
  const section = document.getElementById(`${prefix}-section`)!;
  const toggle = document.getElementById(`toggle${voiceIndex + 1}`)!;
  const waveformSel = document.getElementById(`waveform${voiceIndex + 1}`) as HTMLSelectElement;
  const volumeInput = document.getElementById(`volume${voiceIndex + 1}`) as HTMLInputElement;
  const volumeVal = document.getElementById(`volume${voiceIndex + 1}-val`)!;
  const detuneInput = document.getElementById(`detune${voiceIndex + 1}`) as HTMLInputElement;
  const detuneVal = document.getElementById(`detune${voiceIndex + 1}-val`)!;

  const wfPreview = createWaveformPreview(
    document.getElementById(`waveform${voiceIndex + 1}-preview`) as HTMLCanvasElement
  );
  wfPreview.setWaveform(waveformSel.value as OscillatorType);

  // Detune knob (already in HTML as canvas + hidden input)
  const knob = createKnob(
    document.getElementById(`detune${voiceIndex + 1}-knob`) as HTMLCanvasElement,
    detuneInput,
    {
      min: -100, max: 100, step: 1, value: 0,
      onChange(v) {
        detuneVal.textContent = String(Math.round(v));
        voice.setDetune(v);
      }
    }
  );
  registerKnob(`detune${voiceIndex + 1}`, knob);

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const enabled = !voice.enabled;
    voice.setEnabled(enabled);
    toggle.textContent = enabled ? 'ON' : 'OFF';
    toggle.classList.toggle('on', enabled);
    toggle.classList.toggle('off', !enabled);
    section.classList.toggle('disabled', !enabled);
  });

  waveformSel.addEventListener('change', () => {
    voice.setWaveform(waveformSel.value as OscillatorType);
    wfPreview.setWaveform(waveformSel.value as OscillatorType);
  });

  volumeInput.addEventListener('input', () => {
    const vol = parseFloat(volumeInput.value);
    volumeVal.textContent = vol.toFixed(2);
    voice.setVolume(vol);
  });

  detuneInput.addEventListener('input', () => {
    const cents = parseFloat(detuneInput.value);
    detuneVal.textContent = String(Math.round(cents));
    voice.setDetune(cents);
  });

  const unisonCountInput = document.getElementById(`unison-count${voiceIndex + 1}`) as HTMLInputElement;
  const unisonCountVal = document.getElementById(`unison-count${voiceIndex + 1}-val`)!;
  const unisonDetuneInput = document.getElementById(`unison-detune${voiceIndex + 1}`) as HTMLInputElement;
  const unisonDetuneVal = document.getElementById(`unison-detune${voiceIndex + 1}-val`)!;
  const unisonSpreadInput = document.getElementById(`unison-spread${voiceIndex + 1}`) as HTMLInputElement;
  const unisonSpreadVal = document.getElementById(`unison-spread${voiceIndex + 1}-val`)!;

  unisonCountInput.addEventListener('input', () => {
    const n = parseInt(unisonCountInput.value);
    unisonCountVal.textContent = String(n);
    voice.setUnisonCount(n);
  });

  unisonDetuneInput.addEventListener('input', () => {
    const cents = parseFloat(unisonDetuneInput.value);
    unisonDetuneVal.textContent = String(cents);
    voice.setUnisonDetune(cents);
  });

  unisonSpreadInput.addEventListener('input', () => {
    const spread = parseFloat(unisonSpreadInput.value) / 100;
    unisonSpreadVal.textContent = unisonSpreadInput.value + '%';
    voice.setUnisonSpread(spread);
  });

}
