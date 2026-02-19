import { usePatch } from '../../context/PatchContext';
import { ModKnobControl } from './ModKnobControl';
import type { ModDestination } from '../../models/patch.js';

export function FilterPanel() {
  const { patch, dispatch } = usePatch();
  const cutoffDest: ModDestination = 'filter-cutoff';

  return (
    <div
      className={`filter-panel${patch.global.filterEnabled ? '' : ' disabled'}`}
      id="filter-section"
    >
      <div className="filter-panel-header">
        <span className="filter-panel-label">FILTER</span>
        <div className="filter-header">
          <select
            id="filter-type"
            value={patch.global.filterType}
            onChange={(e) => dispatch({ type: 'SET_GLOBAL', patch: { filterType: e.target.value as BiquadFilterType } })}
          >
            <option value="lowpass">Low Pass</option>
            <option value="highpass">High Pass</option>
            <option value="bandpass">Band Pass</option>
          </select>
          <button
            className={`filter-toggle ${patch.global.filterEnabled ? 'on' : 'off'}`}
            id="filter-toggle"
            onClick={() => dispatch({ type: 'SET_GLOBAL', patch: { filterEnabled: !patch.global.filterEnabled } })}
          >
            {patch.global.filterEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <canvas className="filter-canvas" id="filter-canvas" width="380" height="100"></canvas>
      <div className="filter-values" id="filter-values"></div>
    </div>
  );
}
