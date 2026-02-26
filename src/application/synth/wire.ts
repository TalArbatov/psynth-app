import { startAnimationLoop } from '../../modules/animation-loop.js';
import { initSyncOutbound, initSyncReceive } from '../../modules/sync-handlers.js';
import { byCanvasId, byId } from './dom.js';
import type { SynthRuntime } from './runtime.js';
import type { SynthViews } from './views.js';

export function wireSynth(runtime: SynthRuntime, views: SynthViews): () => void {
  const { sync, engine, lfos, state } = runtime;
  const { adsrGraphs, keyboard, drawList } = views;

  const stopAnimation = startAnimationLoop(engine, lfos, drawList, () => state.baseMasterVolume);

  let filterGraphDestroy: (() => void) | null = null;
  import('../../modules/filter-graph.js')
    .then(({ createFilterGraph }) => {
      const fg = createFilterGraph(byCanvasId('filter-canvas'), byId('filter-values'), engine, () => {
        sync.send({ t: 'filter', cutoff: engine.cutoff, q: engine.resonance });
      });
      drawList.push(fg);
      filterGraphDestroy = fg.destroy;
    })
    .catch((e) => console.error('Filter graph load failed:', e));

  // Keep runtime volume aligned with initial UI value.
  const masterVolumeText = byId('master-volume-val').textContent ?? '0.70';
  const parsed = Number.parseFloat(masterVolumeText);
  if (!Number.isNaN(parsed)) {
    state.baseMasterVolume = parsed;
    engine.setMasterVolume(parsed);
  }

  const cleanupOutbound = initSyncOutbound(sync);
  initSyncReceive(sync, engine, adsrGraphs, keyboard);

  return () => {
    stopAnimation();
    cleanupOutbound();
    filterGraphDestroy?.();
    sync.close();
    engine.destroy();
    views.destroy();
  };
}
