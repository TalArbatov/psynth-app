import { startAnimationLoop } from '../../modules/animation-loop.js';
import { initSyncOutbound, initSyncReceive } from '../../modules/sync-handlers.js';
import { byCanvasId, byId } from './dom.js';
import type { SynthRuntime } from './runtime.js';
import type { SynthViews } from './views.js';

export function wireSynth(runtime: SynthRuntime, views: SynthViews) {
  const { sync, engine, lfos, state } = runtime;
  const { adsrGraphs, keyboard, drawList } = views;

  startAnimationLoop(engine, lfos, drawList, () => state.baseMasterVolume);

  import('../../modules/filter-graph.js')
    .then(({ createFilterGraph }) => {
      drawList.push(
        createFilterGraph(byCanvasId('filter-canvas'), byId('filter-values'), engine, () => {
          sync.send({ t: 'filter', cutoff: engine.cutoff, q: engine.resonance });
        }),
      );
    })
    .catch((e) => console.error('Filter graph load failed:', e));

  // Keep runtime volume aligned with initial UI value.
  const masterVolumeText = byId('master-volume-val').textContent ?? '0.70';
  const parsed = Number.parseFloat(masterVolumeText);
  if (!Number.isNaN(parsed)) {
    state.baseMasterVolume = parsed;
    engine.setMasterVolume(parsed);
  }

  initSyncOutbound(sync);
  initSyncReceive(sync, engine, adsrGraphs, keyboard);
}
