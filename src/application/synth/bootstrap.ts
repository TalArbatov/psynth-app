import { createSynthRuntime } from './runtime.js';
import { createSynthViews } from './views.js';
import { wireSynth } from './wire.js';

/**
 * High-level composition root for the synth client.
 * This is the only place that should orchestrate cross-module wiring.
 */
export function bootstrapSynth() {
  const runtime = createSynthRuntime();
  const views = createSynthViews(runtime);
  wireSynth(runtime, views);
  return runtime;
}
