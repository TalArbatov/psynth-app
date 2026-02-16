import { useState } from 'react';
import { FxPage } from './synth/FxPage';
import { KeyboardFooter } from './synth/KeyboardFooter';
import { MainTabs } from './synth/MainTabs';
import { OscPage } from './synth/OscPage';
import { SequencerPage } from './synth/SequencerPage';
import { SynthHeader } from './synth/SynthHeader';
import type { SynthRuntime } from '../application/synth/runtime.js';

/**
 * Declarative synth shell for React.
 * IDs/data-attributes are intentionally preserved because the audio/UI
 * controller layer binds to this static DOM contract.
 */
export function SynthLayout({ runtime }: { runtime: SynthRuntime | null }) {
  const [activePage, setActivePage] = useState<'osc' | 'fx' | 'seq'>('osc');

  return (
    <div id="synth">
      <SynthHeader />
      <MainTabs activePage={activePage} onChange={setActivePage} />
      <OscPage runtime={runtime} active={activePage === 'osc'} />
      <FxPage runtime={runtime} active={activePage === 'fx'} />
      <SequencerPage runtime={runtime} active={activePage === 'seq'} />
      <KeyboardFooter />
    </div>
  );
}
