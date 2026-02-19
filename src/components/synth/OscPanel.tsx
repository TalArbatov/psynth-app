import { useEffect, useRef, useState } from 'react';
import { usePatch, useOsc } from '../../context/PatchContext';
import { ModKnobControl } from './ModKnobControl';
import { createWaveformPreview } from '../../modules/waveform-preview.js';

function OscSection({ index }: { index: 0 | 1 }) {
  const n = (index + 1) as 1 | 2;
  const { osc, setOsc } = useOsc(index);
  const wfPreviewRef = useRef<ReturnType<typeof createWaveformPreview> | null>(null);

  useEffect(() => {
    const canvas = document.getElementById(`waveform${n}-preview`) as HTMLCanvasElement | null;
    if (canvas && !wfPreviewRef.current) {
      wfPreviewRef.current = createWaveformPreview(canvas);
    }
  }, [n]);

  useEffect(() => {
    wfPreviewRef.current?.setWaveform(osc.waveform);
  }, [osc.waveform]);

  return (
    <div className={`osc-compact${osc.enabled ? '' : ' disabled'}`} id={`osc${n}-section`}>
      <div className="osc-compact-header">
        <span className="osc-compact-label">OSC {n}</span>
        <button
          className={`osc-toggle ${osc.enabled ? 'on' : 'off'}`}
          id={`toggle${n}`}
          onClick={() => setOsc({ enabled: !osc.enabled })}
        >
          {osc.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="osc-compact-body">
        <div className="control-group">
          <label>Wave</label>
          <select
            id={`waveform${n}`}
            value={osc.waveform}
            onChange={(e) => setOsc({ waveform: e.target.value as OscillatorType })}
          >
            <option value="sine">Sine</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="square">Square</option>
          </select>
          <canvas className="waveform-preview" id={`waveform${n}-preview`} width="120" height="30"></canvas>
        </div>

        <div className="osc-knob-row">
          <div className="control-group compact">
            <label>Level</label>
            <ModKnobControl
              id={`volume${n}`}
              min={0}
              max={1}
              step={0.01}
              value={osc.level}
              modDestination={`osc${n}-level`}
              displayValue={osc.level.toFixed(2)}
              onValueChange={(v) => setOsc({ level: v })}
            />
          </div>
          <div className="control-group compact">
            <label>Detune</label>
            <ModKnobControl
              id={`detune${n}`}
              min={-100}
              max={100}
              step={1}
              value={osc.fine}
              modDestination={`osc${n}-detune`}
              displayValue={`${Math.round(osc.fine)}`}
              onValueChange={(v) => setOsc({ fine: v })}
            />
          </div>
        </div>

        <div className="osc-knob-row">
          <div className="control-group compact">
            <label>Unison</label>
            <ModKnobControl
              id={`unison-count${n}`}
              min={1}
              max={8}
              step={1}
              value={osc.unisonCount}
              displayValue={`${osc.unisonCount}`}
              onValueChange={(v) => setOsc({ unisonCount: Math.round(v) })}
            />
          </div>
          <div className="control-group compact">
            <label>Uni Det</label>
            <ModKnobControl
              id={`unison-detune${n}`}
              min={0}
              max={100}
              step={1}
              value={osc.unisonDetune}
              modDestination={`osc${n}-unison-detune`}
              displayValue={`${Math.round(osc.unisonDetune)}`}
              onValueChange={(v) => setOsc({ unisonDetune: v })}
            />
          </div>
          <div className="control-group compact">
            <label>Spread</label>
            <ModKnobControl
              id={`unison-spread${n}`}
              min={0}
              max={100}
              step={1}
              value={osc.unisonSpread}
              modDestination={`osc${n}-unison-spread`}
              displayValue={`${Math.round(osc.unisonSpread)}%`}
              onValueChange={(v) => setOsc({ unisonSpread: v })}
            />
          </div>
        </div>
      </div>

      <canvas className="adsr-canvas" id={`adsr${n}-canvas`} width="300" height="80"></canvas>
      <div className="adsr-values" id={`adsr${n}-values`}></div>
    </div>
  );
}

export function OscPanel() {
  return (
    <div className="osc-panel">
      <OscSection index={0} />
      <OscSection index={1} />
    </div>
  );
}
