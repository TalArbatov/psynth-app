import type { SynthRuntime } from '../application/synth/runtime.js';
import { PatchProvider } from '../context/PatchContext';
import { TopBar } from './synth/TopBar';
import { OscPanel } from './synth/OscPanel';
import { FilterPanel } from './synth/FilterPanel';
import { ModPanel } from './synth/ModPanel';
import { ModMatrixList } from './synth/ModMatrixList';
import { FxRack } from './synth/FxRack';
import { KeyboardFooter } from './synth/KeyboardFooter';

export function SerumLayout({ runtime }: { runtime: SynthRuntime | null }) {
  return (
    <PatchProvider runtime={runtime}>
      <div id="synth">
        <TopBar />

        <div className="serum-main">
          <div className="serum-col serum-col-left">
            <OscPanel />
          </div>

          <div className="serum-col serum-col-center">
            <canvas id="waveform-canvas" width="400" height="80"></canvas>
            <FilterPanel />
          </div>

          <div className="serum-col serum-col-right">
            <ModPanel />
            <ModMatrixList />
          </div>
        </div>

        <FxRack />
        <KeyboardFooter />
      </div>
    </PatchProvider>
  );
}
