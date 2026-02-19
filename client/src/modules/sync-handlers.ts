/**
 * WebSocket sync handlers for multi-tab parameter synchronization.
 * Outbound: event delegation captures input/change/click events.
 * Inbound: dispatches received messages to the appropriate controls.
 */

import type { SyncClient } from './sync.js';
import type { AudioEngine } from './audio-engine.js';
import type { Drawable, PianoKeyboardView } from './types.js';
import { getKnob } from './knob-registry.js';

/** Attach outbound event delegation so local changes broadcast to peers. */
export function initSyncOutbound(sync: SyncClient): void {
  // Sync standard inputs (ranges, number inputs) via event delegation
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id && target.tagName !== 'SELECT' && !sync.receiving) {
      sync.send({ t: 'ctrl', id: target.id, v: target.value });
    }
  }, true);

  // Sync selects via event delegation
  document.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    if (target.id && target.tagName === 'SELECT' && !sync.receiving) {
      sync.send({ t: 'ctrl', id: target.id, v: target.value });
    }
  }, true);

  // Sync toggle buttons
  const syncedButtons = new Set([
    'toggle1', 'toggle2', 'filter-toggle',
    'fx-saturation-toggle', 'fx-eq-toggle', 'fx-chorus-toggle',
    'fx-delay-toggle', 'fx-delay-pp', 'fx-reverb-toggle', 'fx-compressor-toggle'
  ]);
  for (let o = 1; o <= 2; o++) {
    for (let l = 1; l <= 4; l++) {
      syncedButtons.add(`lfo-sync-${o}-${l}`);
      syncedButtons.add(`lfo-oneshot-${o}-${l}`);
    }
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (syncedButtons.has(target.id) && !sync.receiving) {
      sync.send({ t: 'click', id: target.id });
    }
  }, true);
}

/**
 * Register the inbound message handler that applies remote changes locally.
 * @param sync       Sync client
 * @param engine     Audio engine (for ADSR, filter, and note sync)
 * @param adsrGraphs ADSR graph drawables (indexed by voice number)
 * @param keyboard   Piano keyboard view (for remote note highlighting)
 */
export function initSyncReceive(
  sync: SyncClient,
  engine: AudioEngine,
  adsrGraphs: Drawable[],
  keyboard: PianoKeyboardView
): void {
  sync.onMessage((msg) => {
    if (msg.t === 'ctrl') {
      const el = document.getElementById(msg.id) as HTMLInputElement | HTMLSelectElement | null;
      if (!el) return;
      el.value = msg.v;
      getKnob(msg.id)?.setValue(parseFloat(msg.v));
      const evt = el.tagName === 'SELECT' ? 'change' : 'input';
      el.dispatchEvent(new Event(evt, { bubbles: true }));
    } else if (msg.t === 'click') {
      const el = document.getElementById(msg.id);
      if (el) el.click();
    } else if (msg.t === 'adsr') {
      const adsr = engine.voices[msg.n].adsr;
      adsr.a = msg.a;
      adsr.d = msg.d;
      adsr.s = msg.s;
      adsr.r = msg.r;
      adsrGraphs[msg.n].draw();
    } else if (msg.t === 'filter') {
      engine.setFilterCutoff(msg.cutoff);
      engine.setFilterResonance(msg.q);
    } else if (msg.t === 'noteOn') {
      engine.noteOn(msg.f);
      keyboard.remoteNoteOn(msg.f);
    } else if (msg.t === 'noteOff') {
      engine.noteOff(msg.f);
      keyboard.remoteNoteOff(msg.f);
    }
  });
}
