/**
 * Centralized registry for all rotary knob instances.
 * Provides lookup by element ID so that sync handlers, animation loop,
 * and LFO controls can update knob visuals without direct references.
 */

import { createKnob } from './knob.js';
import type { KnobInstance } from './types.js';

const knobInstances = new Map<string, KnobInstance>();

/** Retrieve a knob instance by its DOM element ID. */
export function getKnob(id: string): KnobInstance | undefined {
  return knobInstances.get(id);
}

/** Store a knob instance under the given DOM element ID. */
export function registerKnob(id: string, knob: KnobInstance): void {
  knobInstances.set(id, knob);
}

/**
 * Replace every `<input type="range">` inside `#synth` with a
 * canvas-based rotary knob + hidden input pair.
 * Must be called after all dynamic DOM sections (e.g. LFO panels) are built.
 */
export function upgradeAllSliders(): void {
  const sliders = document.querySelectorAll<HTMLInputElement>('#synth input[type="range"]');
  sliders.forEach(slider => {
    const id = slider.id;
    const minVal = parseFloat(slider.min);
    const maxVal = parseFloat(slider.max);
    const stepVal = parseFloat(slider.step);
    const val = parseFloat(slider.value);

    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 56;
    canvas.className = 'knob-canvas';

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = id;

    const parent = slider.parentNode!;
    parent.insertBefore(canvas, slider);
    parent.insertBefore(hidden, slider);
    parent.removeChild(slider);

    const knob = createKnob(canvas, hidden, {
      min: minVal, max: maxVal, step: stepVal, value: val
    });

    knobInstances.set(id, knob);
  });
}
