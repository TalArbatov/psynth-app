import { usePatch } from '../../context/PatchContext';
import { ModKnobControl } from './ModKnobControl';

export function TopBar() {
  const { patch, dispatch, canUndo, canRedo } = usePatch();

  return (
    <div className="serum-topbar">
      <div className="topbar-left">
        <span className="synth-logo">SYNTH</span>
        <span className="patch-name">{patch.name}</span>
      </div>
      <div className="topbar-center">
        <button
          className="topbar-btn"
          disabled={!canUndo}
          onClick={() => dispatch({ type: 'UNDO' })}
          title="Undo (Ctrl+Z)"
        >
          UNDO
        </button>
        <button
          className="topbar-btn"
          disabled={!canRedo}
          onClick={() => dispatch({ type: 'REDO' })}
          title="Redo (Ctrl+Y)"
        >
          REDO
        </button>
      </div>
      <div className="topbar-right">
        <div className="control-group compact">
          <label>Master</label>
          <ModKnobControl
            id="master-volume"
            min={0}
            max={1}
            step={0.01}
            value={patch.global.masterVolume}
            modDestination="master-volume"
            displayValue={patch.global.masterVolume.toFixed(2)}
            onValueChange={(v) => dispatch({ type: 'SET_GLOBAL', patch: { masterVolume: v } })}
          />
        </div>
        <div className="topbar-global-controls">
          <div className="control-group compact">
            <label>Glide</label>
            <ModKnobControl
              id="global-glide"
              min={0}
              max={1}
              step={0.01}
              value={patch.global.glide}
              displayValue={patch.global.glide.toFixed(2)}
              onValueChange={(v) => dispatch({ type: 'SET_GLOBAL', patch: { glide: v } })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
