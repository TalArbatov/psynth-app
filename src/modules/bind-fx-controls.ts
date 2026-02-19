/**
 * Declarative FX control binding.
 * Replaces ~165 lines of per-control boilerplate with a data-driven approach.
 */

import type { FXChain } from './fx/fx-chain.js';
import type { SaturationParams } from './types.js';

interface FXControlDef {
  id: string;
  param: string;
  format: (v: number) => string;
}

const fmt    = (v: number) => String(v);
const fmtF1  = (v: number) => v.toFixed(1);
const fmtF2  = (v: number) => v.toFixed(2);
const fmtHz  = (v: number) => v + ' Hz';
const fmtDb  = (v: number) => v + ' dB';
const fmtPct = (v: number) => v + '%';
const fmtMs  = (v: number) => Math.round(v * 1000) + ' ms';
const fmtDbF1 = (v: number) => v.toFixed(1) + ' dB';

/** Bind a list of range-based controls to an effect unit's `set()` method. */
function bindFXKnobs<T>(effect: { set(params: T): void }, defs: FXControlDef[]): void {
  for (const { id, param, format } of defs) {
    document.getElementById(id)!.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      document.getElementById(`${id}-val`)!.textContent = format(v);
      effect.set({ [param]: v } as T);
    });
  }
}

function bindFXToggle(id: string, effect: { setEnabled(on: boolean): void }, fxUnit: HTMLElement): void {
  const btn = document.getElementById(id)!;
  let enabled = false;
  btn.addEventListener('click', () => {
    enabled = !enabled;
    effect.setEnabled(enabled);
    btn.textContent = enabled ? 'ON' : 'OFF';
    btn.classList.toggle('on', enabled);
    btn.classList.toggle('off', !enabled);
    fxUnit.classList.toggle('active', enabled);
  });
}

/**
 * Bind all FX toggle buttons, parameter knobs, and special controls.
 * @param fxChain  The FX processing chain
 */
export function bindAllFXControls(fxChain: FXChain): void {
  // --- Toggles ---
  bindFXToggle('fx-saturation-toggle', fxChain.saturation, document.getElementById('fx-saturation')!);
  bindFXToggle('fx-eq-toggle', fxChain.eq, document.getElementById('fx-eq')!);
  bindFXToggle('fx-chorus-toggle', fxChain.chorus, document.getElementById('fx-chorus')!);
  bindFXToggle('fx-delay-toggle', fxChain.delay, document.getElementById('fx-delay')!);
  bindFXToggle('fx-reverb-toggle', fxChain.reverb, document.getElementById('fx-reverb')!);
  bindFXToggle('fx-compressor-toggle', fxChain.compressor, document.getElementById('fx-compressor')!);

  // --- Saturation ---
  (document.getElementById('fx-sat-type') as HTMLSelectElement).addEventListener('change', (e) => {
    fxChain.saturation.set({ type: (e.target as HTMLSelectElement).value as SaturationParams['type'] });
  });
  bindFXKnobs(fxChain.saturation, [
    { id: 'fx-sat-drive',  param: 'drive',  format: fmt },
    { id: 'fx-sat-output', param: 'output', format: fmtF2 },
    { id: 'fx-sat-tone',   param: 'tone',   format: fmtHz },
    { id: 'fx-sat-mix',    param: 'mix',    format: fmtF2 },
  ]);

  // --- EQ ---
  bindFXKnobs(fxChain.eq, [
    { id: 'fx-eq-hp',         param: 'hpFreq',    format: fmtHz },
    { id: 'fx-eq-band-freq',  param: 'bandFreq',  format: fmtHz },
    { id: 'fx-eq-band-gain',  param: 'bandGain',  format: fmtDb },
    { id: 'fx-eq-band-q',     param: 'bandQ',     format: fmtF1 },
    { id: 'fx-eq-shelf-freq', param: 'shelfFreq', format: fmtHz },
    { id: 'fx-eq-shelf-gain', param: 'shelfGain', format: fmtDb },
  ]);

  // --- Chorus ---
  bindFXKnobs(fxChain.chorus, [
    { id: 'fx-chorus-rate',   param: 'rate',   format: fmtF1 },
    { id: 'fx-chorus-depth',  param: 'depth',  format: fmtF1 },
    { id: 'fx-chorus-delay',  param: 'delay',  format: fmtF1 },
    { id: 'fx-chorus-spread', param: 'spread', format: fmtPct },
    { id: 'fx-chorus-mix',    param: 'mix',    format: fmtF2 },
  ]);

  // --- Delay ---
  bindFXKnobs(fxChain.delay, [
    { id: 'fx-delay-time',     param: 'time',      format: fmt },
    { id: 'fx-delay-feedback', param: 'feedback',   format: fmtF2 },
    { id: 'fx-delay-mix',      param: 'mix',        format: fmtF2 },
    { id: 'fx-delay-filter',   param: 'filterFreq', format: fmtHz },
  ]);

  // Ping-pong toggle
  let delayPP = false;
  const ppBtn = document.getElementById('fx-delay-pp')!;
  ppBtn.addEventListener('click', () => {
    delayPP = !delayPP;
    ppBtn.textContent = delayPP ? 'ON' : 'OFF';
    ppBtn.classList.toggle('on', delayPP);
    ppBtn.classList.toggle('off', !delayPP);
    fxChain.delay.set({ pingPong: delayPP });
  });

  // --- Reverb ---
  bindFXKnobs(fxChain.reverb, [
    { id: 'fx-reverb-size',     param: 'size',     format: fmtF1 },
    { id: 'fx-reverb-predelay', param: 'preDelay', format: fmt },
    { id: 'fx-reverb-damping',  param: 'damping',  format: fmtHz },
    { id: 'fx-reverb-mix',      param: 'mix',      format: fmtF2 },
  ]);

  // --- Compressor ---
  bindFXKnobs(fxChain.compressor, [
    { id: 'fx-comp-threshold', param: 'threshold', format: fmtDb },
    { id: 'fx-comp-ratio',     param: 'ratio',     format: fmtF1 },
    { id: 'fx-comp-attack',    param: 'attack',    format: fmtMs },
    { id: 'fx-comp-release',   param: 'release',   format: fmtMs },
    { id: 'fx-comp-makeup',    param: 'makeup',    format: fmtDbF1 },
  ]);
}
