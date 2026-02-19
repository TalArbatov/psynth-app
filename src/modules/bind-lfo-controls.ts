/** Binds all 8 LFO parameter panels and wires one-shot retrigger on note-on. */

import type { LFO, LFOWaveform, LFODivision } from './lfo.js';
import type { AudioEngine } from './audio-engine.js';
import { getKnob } from './knob-registry.js';
import { createWaveformPreview } from './waveform-preview.js';

function bindLFOControls(lfo: LFO, oscIndex: number, lfoIndex: number): void {
  const o = oscIndex + 1;
  const l = lfoIndex + 1;

  const waveformSel = document.getElementById(`lfo-waveform-${o}-${l}`) as HTMLSelectElement;
  const rateInput = document.getElementById(`lfo-rate-${o}-${l}`) as HTMLInputElement;
  const rateVal = document.getElementById(`lfo-rate-${o}-${l}-val`)!;
  const depthInput = document.getElementById(`lfo-depth-${o}-${l}`) as HTMLInputElement;
  const depthVal = document.getElementById(`lfo-depth-${o}-${l}-val`)!;
  const phaseInput = document.getElementById(`lfo-phase-${o}-${l}`) as HTMLInputElement;
  const phaseVal = document.getElementById(`lfo-phase-${o}-${l}-val`)!;
  const delayInput = document.getElementById(`lfo-delay-${o}-${l}`) as HTMLInputElement;
  const delayVal = document.getElementById(`lfo-delay-${o}-${l}-val`)!;
  const fadeinInput = document.getElementById(`lfo-fadein-${o}-${l}`) as HTMLInputElement;
  const fadeinVal = document.getElementById(`lfo-fadein-${o}-${l}-val`)!;
  const syncToggle = document.getElementById(`lfo-sync-${o}-${l}`)!;
  const bpmInput = document.getElementById(`lfo-bpm-${o}-${l}`) as HTMLInputElement;
  const divisionSelect = document.getElementById(`lfo-division-${o}-${l}`) as HTMLSelectElement;
  const oneshotToggle = document.getElementById(`lfo-oneshot-${o}-${l}`)!;

  const lfoWfPreview = createWaveformPreview(
    document.getElementById(`lfo-waveform-${o}-${l}-preview`) as HTMLCanvasElement
  );
  lfoWfPreview.setWaveform(waveformSel.value as OscillatorType);

  waveformSel.addEventListener('change', () => {
    lfo.waveform = waveformSel.value as LFOWaveform;
    lfoWfPreview.setWaveform(waveformSel.value as OscillatorType);
  });

  rateInput.addEventListener('input', () => {
    lfo.rate = parseFloat(rateInput.value);
    rateVal.textContent = lfo.rate.toFixed(2);
  });

  depthInput.addEventListener('input', () => {
    const pct = parseInt(depthInput.value);
    lfo.depth = pct / 100;
    depthVal.textContent = pct + '%';
  });

  phaseInput.addEventListener('input', () => {
    lfo.phase = parseInt(phaseInput.value);
    phaseVal.textContent = lfo.phase + '\u00B0';
  });

  delayInput.addEventListener('input', () => {
    lfo.delay = parseFloat(delayInput.value);
    delayVal.textContent = lfo.delay.toFixed(2);
  });

  fadeinInput.addEventListener('input', () => {
    lfo.fadeIn = parseFloat(fadeinInput.value);
    fadeinVal.textContent = lfo.fadeIn.toFixed(2);
  });

  syncToggle.addEventListener('click', () => {
    lfo.bpmSync = !lfo.bpmSync;
    syncToggle.classList.toggle('on', lfo.bpmSync);
    syncToggle.classList.toggle('off', !lfo.bpmSync);
    bpmInput.disabled = !lfo.bpmSync;
    divisionSelect.disabled = !lfo.bpmSync;
    getKnob(`lfo-rate-${o}-${l}`)?.setEnabled(!lfo.bpmSync);
  });

  bpmInput.addEventListener('input', () => {
    lfo.bpm = parseFloat(bpmInput.value) || 120;
  });

  divisionSelect.addEventListener('change', () => {
    lfo.syncDivision = divisionSelect.value as LFODivision;
  });

  oneshotToggle.addEventListener('click', () => {
    lfo.oneShot = !lfo.oneShot;
    oneshotToggle.classList.toggle('on', lfo.oneShot);
    oneshotToggle.classList.toggle('off', !lfo.oneShot);
  });
}

/**
 * Bind controls for all 8 LFOs (2 oscillators x 4 LFOs) and wire
 * one-shot retrigger so that one-shot LFOs reset on each note-on.
 * @param lfos    2D array of LFO instances [oscIndex][lfoIndex]
 * @param engine  Audio engine (for voice.onNoteOn callback)
 */
export function bindAllLFOControls(lfos: LFO[][], engine: AudioEngine): void {
  for (let o = 0; o < 2; o++) {
    for (let l = 0; l < 4; l++) {
      bindLFOControls(lfos[o][l], o, l);
    }
    // One-shot retrigger: reset all one-shot LFOs for this osc on note-on
    engine.voices[o].onNoteOn = () => {
      for (let l = 0; l < 4; l++) {
        if (lfos[o][l].oneShot) lfos[o][l].reset();
      }
    };
  }
}
