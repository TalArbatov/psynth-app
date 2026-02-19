import { useEffect, useRef, useState } from 'react';
import { usePatch, useLfo } from '../../context/PatchContext';
import { ModKnobControl } from './ModKnobControl';
import { MOD_SOURCE_COLORS } from '../../models/mod-destinations.js';
import type { ModSource, LfoPatch } from '../../models/patch.js';
import { createWaveformPreview } from '../../modules/waveform-preview.js';

const LFO_DIVISIONS: LfoPatch['syncDivision'][] = ['1/1', '1/2', '1/4', '1/8', '1/16'];

function LfoTab({ index }: { index: number }) {
  const { lfo, setLfo } = useLfo(index);
  const lfoN = index + 1;
  const source: ModSource = `lfo${lfoN}` as ModSource;
  const color = MOD_SOURCE_COLORS[source];
  const { setDragSource } = usePatch();

  const previewRef = useRef<ReturnType<typeof createWaveformPreview> | null>(null);

  useEffect(() => {
    const canvas = document.getElementById(`mod-lfo-${lfoN}-preview`) as HTMLCanvasElement | null;
    if (canvas && !previewRef.current) {
      previewRef.current = createWaveformPreview(canvas);
    }
  }, [lfoN]);

  useEffect(() => {
    previewRef.current?.setWaveform(lfo.waveform as OscillatorType);
  }, [lfo.waveform]);

  return (
    <div className="mod-lfo-panel">
      <div className="mod-lfo-header">
        <span className="mod-lfo-label" style={{ color }}>LFO {lfoN}</span>
        <div
          className="mod-chip"
          style={{ background: color }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'link';
            e.dataTransfer.setData('text/plain', source);
            setDragSource(source);
          }}
          onDragEnd={() => setDragSource(null)}
        >
          MOD
        </div>
      </div>

      <div className="mod-lfo-controls">
        <div className="control-group compact">
          <label>Wave</label>
          <select
            id={`mod-lfo-waveform-${lfoN}`}
            value={lfo.waveform}
            onChange={(e) => setLfo({ waveform: e.target.value as LfoPatch['waveform'] })}
          >
            <option value="sine">Sin</option>
            <option value="triangle">Tri</option>
            <option value="square">Sqr</option>
            <option value="sawtooth">Saw</option>
          </select>
          <canvas className="waveform-preview" id={`mod-lfo-${lfoN}-preview`} width="80" height="24"></canvas>
        </div>

        <div className="mod-knob-row">
          <div className="control-group compact">
            <label>Rate</label>
            <ModKnobControl
              id={`mod-lfo-rate-${lfoN}`}
              min={0.05}
              max={20}
              step={0.05}
              value={lfo.rate}
              disabled={lfo.bpmSync}
              displayValue={lfo.rate.toFixed(2)}
              onValueChange={(rate) => setLfo({ rate })}
            />
          </div>
          <div className="control-group compact">
            <label>Depth</label>
            <ModKnobControl
              id={`mod-lfo-depth-${lfoN}`}
              min={0}
              max={1}
              step={0.01}
              value={lfo.depth}
              displayValue={`${Math.round(lfo.depth * 100)}%`}
              onValueChange={(depth) => setLfo({ depth })}
            />
          </div>
        </div>

        <div className="mod-knob-row">
          <div className="control-group compact">
            <label>Phase</label>
            <ModKnobControl
              id={`mod-lfo-phase-${lfoN}`}
              min={0}
              max={360}
              step={1}
              value={lfo.phase}
              displayValue={`${Math.round(lfo.phase)}`}
              onValueChange={(phase) => setLfo({ phase })}
            />
          </div>
          <div className="control-group compact">
            <label>Delay</label>
            <ModKnobControl
              id={`mod-lfo-delay-${lfoN}`}
              min={0}
              max={5}
              step={0.05}
              value={lfo.delay}
              displayValue={lfo.delay.toFixed(2)}
              onValueChange={(delay) => setLfo({ delay })}
            />
          </div>
        </div>

        <div className="mod-lfo-sync-row">
          <button
            className={`lfo-sync-toggle ${lfo.bpmSync ? 'on' : 'off'}`}
            onClick={() => setLfo({ bpmSync: !lfo.bpmSync })}
          >
            SYNC
          </button>
          {lfo.bpmSync && (
            <>
              <input
                type="number"
                className="lfo-bpm-input"
                value={lfo.bpm}
                min={20}
                max={300}
                onChange={(e) => setLfo({ bpm: parseFloat(e.target.value) || 120 })}
              />
              <select
                className="lfo-division-select"
                value={lfo.syncDivision}
                onChange={(e) => setLfo({ syncDivision: e.target.value as LfoPatch['syncDivision'] })}
              >
                {LFO_DIVISIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </>
          )}
          <button
            className={`lfo-oneshot-toggle ${lfo.oneShot ? 'on' : 'off'}`}
            onClick={() => setLfo({ oneShot: !lfo.oneShot })}
          >
            1-SHOT
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModPanel() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="mod-panel">
      <div className="mod-tabs">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={`mod-tab${activeTab === i ? ' active' : ''}`}
            style={activeTab === i ? { borderBottomColor: MOD_SOURCE_COLORS[`lfo${i + 1}` as ModSource] } : undefined}
            onClick={() => setActiveTab(i)}
          >
            LFO {i + 1}
          </button>
        ))}
      </div>
      <LfoTab key={activeTab} index={activeTab} />
    </div>
  );
}
