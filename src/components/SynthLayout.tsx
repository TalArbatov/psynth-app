import { useEffect, useState } from 'react';
import { FxPage } from './synth/FxPage';
import { KeyboardFooter } from './synth/KeyboardFooter';
import { MainTabs } from './synth/MainTabs';
import { OscPage } from './synth/OscPage';
import { SequencerPage } from './synth/SequencerPage';
import { SynthTopBar } from './synth/SynthTopBar';
import { PresetBrowser } from './synth/PresetBrowser';
import type { SynthRuntime } from '../application/synth/runtime.js';
import { usePresetStore } from '../hooks/usePresetStore.js';

export function SynthLayout({ runtime }: { runtime: SynthRuntime | null }) {
  const [activePage, setActivePage] = useState<'osc' | 'fx' | 'seq'>('osc');
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [browserOpen, setBrowserOpen] = useState(false);

  const store = usePresetStore(runtime);

  // Apply master volume when preset changes
  useEffect(() => {
    if (!store.patchData) return;
    const mv = store.patchData.masterVolume as number | undefined;
    if (mv !== undefined) {
      setMasterVolume(mv);
      if (runtime) {
        runtime.state.baseMasterVolume = mv;
        runtime.engine.setMasterVolume(mv);
      }
    }
  }, [store.patchData, store.resetCount, runtime]);

  return (
    <div id="synth">
      <SynthTopBar
        runtime={runtime}
        masterVolume={masterVolume}
        setMasterVolume={setMasterVolume}
        presetName={store.loadedRef?.name ?? 'Init'}
        onPrevPreset={store.prevPreset}
        onNextPreset={store.nextPreset}
        canPrev={store.canPrev}
        canNext={store.canNext}
        onSaveAs={store.saveAs}
        onNewPreset={store.newPatch}
        onOpenBrowser={() => setBrowserOpen(true)}
      />
      <MainTabs activePage={activePage} onChange={setActivePage} />
      <OscPage runtime={runtime} active={activePage === 'osc'} masterVolume={masterVolume} setMasterVolume={setMasterVolume} activePresetData={store.patchData} resetCount={store.resetCount} />
      <FxPage runtime={runtime} active={activePage === 'fx'} activePresetData={store.patchData} resetCount={store.resetCount} />
      <SequencerPage runtime={runtime} active={activePage === 'seq'} />
      <KeyboardFooter />
      <PresetBrowser
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        store={store}
        runtime={runtime}
      />
    </div>
  );
}
