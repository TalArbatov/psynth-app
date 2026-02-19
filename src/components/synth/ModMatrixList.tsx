import { usePatch } from '../../context/PatchContext';
import { MOD_SOURCE_COLORS, MOD_DESTINATION_LABELS } from '../../models/mod-destinations.js';

export function ModMatrixList() {
  const { patch, dispatch } = usePatch();
  const routings = patch.modMatrix;

  if (routings.length === 0) {
    return (
      <div className="mod-matrix-empty">
        <span className="mod-matrix-hint">Drag MOD chips onto knobs to create routings</span>
      </div>
    );
  }

  return (
    <div className="mod-matrix-list">
      <div className="mod-matrix-header">
        <span>MOD MATRIX</span>
      </div>
      {routings.map((r) => {
        const color = MOD_SOURCE_COLORS[r.source] ?? '#00d2ff';
        const destLabel = MOD_DESTINATION_LABELS[r.destination] ?? r.destination;
        return (
          <div key={r.id} className="mod-matrix-row">
            <span className="mod-matrix-source" style={{ color }}>{r.source.toUpperCase()}</span>
            <span className="mod-matrix-arrow">→</span>
            <span className="mod-matrix-dest">{destLabel}</span>
            <input
              type="range"
              className="mod-matrix-amount"
              min={-1}
              max={1}
              step={0.01}
              value={r.amount}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_MOD_ROUTING', id: r.id, amount: parseFloat(e.target.value) })
              }
            />
            <span className="mod-matrix-amount-val">{r.amount > 0 ? '+' : ''}{r.amount.toFixed(2)}</span>
            <button
              className="mod-matrix-remove"
              onClick={() => dispatch({ type: 'REMOVE_MOD_ROUTING', id: r.id })}
              title="Remove routing"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
