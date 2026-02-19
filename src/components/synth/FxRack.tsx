import { useState } from 'react';
import { usePatch } from '../../context/PatchContext';
import { ModKnobControl } from './ModKnobControl';
import type { FxPatch } from '../../models/patch.js';

type FxTab = 'saturation' | 'eq' | 'chorus' | 'delay' | 'reverb' | 'compressor';
const FX_TABS: Array<{ key: FxTab; label: string }> = [
  { key: 'saturation', label: 'SAT' },
  { key: 'eq', label: 'EQ' },
  { key: 'chorus', label: 'CHR' },
  { key: 'delay', label: 'DLY' },
  { key: 'reverb', label: 'REV' },
  { key: 'compressor', label: 'CMP' },
];

export function FxRack() {
  const { patch, dispatch } = usePatch();
  const [activeTab, setActiveTab] = useState<FxTab>('saturation');

  const setFx = <K extends keyof FxPatch>(key: K, p: Partial<FxPatch[K]>) => {
    dispatch({ type: 'SET_FX', key, patch: p });
  };

  const fx = patch.fx;

  return (
    <div className="fx-rack">
      <div className="fx-rack-tabs">
        {FX_TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`fx-rack-tab${activeTab === key ? ' active' : ''}${fx[key].enabled ? ' enabled' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="fx-rack-body">
        {activeTab === 'saturation' && (
          <div className="fx-rack-unit">
            <div className="fx-rack-unit-header">
              <span>Saturation</span>
              <button
                className={`fx-toggle ${fx.saturation.enabled ? 'on' : 'off'}`}
                onClick={() => setFx('saturation', { enabled: !fx.saturation.enabled })}
              >
                {fx.saturation.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="fx-rack-controls">
              <div className="control-group compact">
                <label>Type</label>
                <select
                  value={fx.saturation.type}
                  onChange={(e) => setFx('saturation', { type: e.target.value as 'soft' | 'hard' | 'wave' })}
                >
                  <option value="soft">Soft</option>
                  <option value="hard">Hard</option>
                  <option value="wave">Wave</option>
                </select>
              </div>
              <div className="control-group compact">
                <label>Drive</label>
                <ModKnobControl
                  id="fx-sat-drive"
                  min={1} max={100} step={1}
                  value={fx.saturation.drive}
                  modDestination="fx-sat-drive"
                  displayValue={`${Math.round(fx.saturation.drive)}`}
                  onValueChange={(v) => setFx('saturation', { drive: v })}
                />
              </div>
              <div className="control-group compact">
                <label>Output</label>
                <ModKnobControl
                  id="fx-sat-output"
                  min={0} max={1} step={0.01}
                  value={fx.saturation.output}
                  displayValue={fx.saturation.output.toFixed(2)}
                  onValueChange={(v) => setFx('saturation', { output: v })}
                />
              </div>
              <div className="control-group compact">
                <label>Tone</label>
                <ModKnobControl
                  id="fx-sat-tone"
                  min={200} max={8000} step={10}
                  value={fx.saturation.tone}
                  displayValue={`${Math.round(fx.saturation.tone)}`}
                  onValueChange={(v) => setFx('saturation', { tone: v })}
                />
              </div>
              <div className="control-group compact">
                <label>Mix</label>
                <ModKnobControl
                  id="fx-sat-mix"
                  min={0} max={1} step={0.01}
                  value={fx.saturation.mix}
                  modDestination="fx-sat-mix"
                  displayValue={fx.saturation.mix.toFixed(2)}
                  onValueChange={(v) => setFx('saturation', { mix: v })}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'eq' && (
          <div className="fx-rack-unit">
            <div className="fx-rack-unit-header">
              <span>EQ</span>
              <button
                className={`fx-toggle ${fx.eq.enabled ? 'on' : 'off'}`}
                onClick={() => setFx('eq', { enabled: !fx.eq.enabled })}
              >
                {fx.eq.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="fx-rack-controls">
              <div className="control-group compact">
                <label>HP Freq</label>
                <ModKnobControl id="fx-eq-hp" min={20} max={2000} step={1} value={fx.eq.hpFreq} displayValue={`${Math.round(fx.eq.hpFreq)}`} onValueChange={(v) => setFx('eq', { hpFreq: v })} />
              </div>
              <div className="control-group compact">
                <label>Band</label>
                <ModKnobControl id="fx-eq-band-freq" min={100} max={10000} step={10} value={fx.eq.bandFreq} displayValue={`${Math.round(fx.eq.bandFreq)}`} onValueChange={(v) => setFx('eq', { bandFreq: v })} />
              </div>
              <div className="control-group compact">
                <label>Gain</label>
                <ModKnobControl id="fx-eq-band-gain" min={-24} max={24} step={0.5} value={fx.eq.bandGain} displayValue={`${fx.eq.bandGain.toFixed(1)}`} onValueChange={(v) => setFx('eq', { bandGain: v })} />
              </div>
              <div className="control-group compact">
                <label>Q</label>
                <ModKnobControl id="fx-eq-band-q" min={0.1} max={18} step={0.1} value={fx.eq.bandQ} displayValue={fx.eq.bandQ.toFixed(1)} onValueChange={(v) => setFx('eq', { bandQ: v })} />
              </div>
              <div className="control-group compact">
                <label>Shelf</label>
                <ModKnobControl id="fx-eq-shelf-freq" min={1000} max={16000} step={100} value={fx.eq.shelfFreq} displayValue={`${Math.round(fx.eq.shelfFreq)}`} onValueChange={(v) => setFx('eq', { shelfFreq: v })} />
              </div>
              <div className="control-group compact">
                <label>Sh Gain</label>
                <ModKnobControl id="fx-eq-shelf-gain" min={-12} max={12} step={0.5} value={fx.eq.shelfGain} displayValue={`${fx.eq.shelfGain.toFixed(1)}`} onValueChange={(v) => setFx('eq', { shelfGain: v })} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chorus' && (
          <div className="fx-rack-unit">
            <div className="fx-rack-unit-header">
              <span>Chorus</span>
              <button
                className={`fx-toggle ${fx.chorus.enabled ? 'on' : 'off'}`}
                onClick={() => setFx('chorus', { enabled: !fx.chorus.enabled })}
              >
                {fx.chorus.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="fx-rack-controls">
              <div className="control-group compact">
                <label>Rate</label>
                <ModKnobControl id="fx-chorus-rate" min={0.1} max={5} step={0.1} value={fx.chorus.rate} modDestination="fx-chorus-rate" displayValue={fx.chorus.rate.toFixed(1)} onValueChange={(v) => setFx('chorus', { rate: v })} />
              </div>
              <div className="control-group compact">
                <label>Depth</label>
                <ModKnobControl id="fx-chorus-depth" min={0} max={20} step={0.5} value={fx.chorus.depth} modDestination="fx-chorus-depth" displayValue={fx.chorus.depth.toFixed(1)} onValueChange={(v) => setFx('chorus', { depth: v })} />
              </div>
              <div className="control-group compact">
                <label>Delay</label>
                <ModKnobControl id="fx-chorus-delay" min={1} max={30} step={0.5} value={fx.chorus.delay} displayValue={fx.chorus.delay.toFixed(1)} onValueChange={(v) => setFx('chorus', { delay: v })} />
              </div>
              <div className="control-group compact">
                <label>Spread</label>
                <ModKnobControl id="fx-chorus-spread" min={0} max={100} step={1} value={fx.chorus.spread} displayValue={`${Math.round(fx.chorus.spread)}%`} onValueChange={(v) => setFx('chorus', { spread: v })} />
              </div>
              <div className="control-group compact">
                <label>Mix</label>
                <ModKnobControl id="fx-chorus-mix" min={0} max={1} step={0.01} value={fx.chorus.mix} modDestination="fx-chorus-mix" displayValue={fx.chorus.mix.toFixed(2)} onValueChange={(v) => setFx('chorus', { mix: v })} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delay' && (
          <div className="fx-rack-unit">
            <div className="fx-rack-unit-header">
              <span>Delay</span>
              <button
                className={`fx-toggle ${fx.delay.enabled ? 'on' : 'off'}`}
                onClick={() => setFx('delay', { enabled: !fx.delay.enabled })}
              >
                {fx.delay.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="fx-rack-controls">
              <div className="control-group compact">
                <label>Time</label>
                <ModKnobControl id="fx-delay-time" min={1} max={2000} step={1} value={fx.delay.time} modDestination="fx-delay-time" displayValue={`${Math.round(fx.delay.time)}`} onValueChange={(v) => setFx('delay', { time: v })} />
              </div>
              <div className="control-group compact">
                <label>Feedback</label>
                <ModKnobControl id="fx-delay-feedback" min={0} max={0.95} step={0.01} value={fx.delay.feedback} modDestination="fx-delay-feedback" displayValue={fx.delay.feedback.toFixed(2)} onValueChange={(v) => setFx('delay', { feedback: v })} />
              </div>
              <div className="control-group compact">
                <label>Mix</label>
                <ModKnobControl id="fx-delay-mix" min={0} max={1} step={0.01} value={fx.delay.mix} modDestination="fx-delay-mix" displayValue={fx.delay.mix.toFixed(2)} onValueChange={(v) => setFx('delay', { mix: v })} />
              </div>
              <div className="control-group compact">
                <label>Filter</label>
                <ModKnobControl id="fx-delay-filter" min={200} max={12000} step={100} value={fx.delay.filterFreq} displayValue={`${Math.round(fx.delay.filterFreq)}`} onValueChange={(v) => setFx('delay', { filterFreq: v })} />
              </div>
              <div className="control-group compact">
                <label>Ping-Pong</label>
                <button
                  className={`fx-toggle ${fx.delay.pingPong ? 'on' : 'off'}`}
                  onClick={() => setFx('delay', { pingPong: !fx.delay.pingPong })}
                >
                  {fx.delay.pingPong ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reverb' && (
          <div className="fx-rack-unit">
            <div className="fx-rack-unit-header">
              <span>Reverb</span>
              <button
                className={`fx-toggle ${fx.reverb.enabled ? 'on' : 'off'}`}
                onClick={() => setFx('reverb', { enabled: !fx.reverb.enabled })}
              >
                {fx.reverb.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="fx-rack-controls">
              <div className="control-group compact">
                <label>Size</label>
                <ModKnobControl id="fx-reverb-size" min={0.1} max={8} step={0.1} value={fx.reverb.size} modDestination="fx-reverb-size" displayValue={fx.reverb.size.toFixed(1)} onValueChange={(v) => setFx('reverb', { size: v })} />
              </div>
              <div className="control-group compact">
                <label>Pre-Dly</label>
                <ModKnobControl id="fx-reverb-predelay" min={0} max={100} step={1} value={fx.reverb.preDelay} displayValue={`${Math.round(fx.reverb.preDelay)}`} onValueChange={(v) => setFx('reverb', { preDelay: v })} />
              </div>
              <div className="control-group compact">
                <label>Damping</label>
                <ModKnobControl id="fx-reverb-damping" min={1000} max={16000} step={100} value={fx.reverb.damping} displayValue={`${Math.round(fx.reverb.damping)}`} onValueChange={(v) => setFx('reverb', { damping: v })} />
              </div>
              <div className="control-group compact">
                <label>Mix</label>
                <ModKnobControl id="fx-reverb-mix" min={0} max={1} step={0.01} value={fx.reverb.mix} modDestination="fx-reverb-mix" displayValue={fx.reverb.mix.toFixed(2)} onValueChange={(v) => setFx('reverb', { mix: v })} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compressor' && (
          <div className="fx-rack-unit">
            <div className="fx-rack-unit-header">
              <span>Compressor</span>
              <button
                className={`fx-toggle ${fx.compressor.enabled ? 'on' : 'off'}`}
                onClick={() => setFx('compressor', { enabled: !fx.compressor.enabled })}
              >
                {fx.compressor.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="fx-rack-controls">
              <div className="control-group compact">
                <label>Thresh</label>
                <ModKnobControl id="fx-comp-threshold" min={-60} max={0} step={1} value={fx.compressor.threshold} modDestination="fx-comp-threshold" displayValue={`${Math.round(fx.compressor.threshold)}`} onValueChange={(v) => setFx('compressor', { threshold: v })} />
              </div>
              <div className="control-group compact">
                <label>Ratio</label>
                <ModKnobControl id="fx-comp-ratio" min={1} max={20} step={0.5} value={fx.compressor.ratio} modDestination="fx-comp-ratio" displayValue={fx.compressor.ratio.toFixed(1)} onValueChange={(v) => setFx('compressor', { ratio: v })} />
              </div>
              <div className="control-group compact">
                <label>Attack</label>
                <ModKnobControl id="fx-comp-attack" min={0.001} max={0.1} step={0.001} value={fx.compressor.attack} displayValue={`${Math.round(fx.compressor.attack * 1000)}ms`} onValueChange={(v) => setFx('compressor', { attack: v })} />
              </div>
              <div className="control-group compact">
                <label>Release</label>
                <ModKnobControl id="fx-comp-release" min={0.01} max={1} step={0.01} value={fx.compressor.release} displayValue={`${Math.round(fx.compressor.release * 1000)}ms`} onValueChange={(v) => setFx('compressor', { release: v })} />
              </div>
              <div className="control-group compact">
                <label>Makeup</label>
                <ModKnobControl id="fx-comp-makeup" min={0} max={24} step={0.5} value={fx.compressor.makeup} displayValue={`${fx.compressor.makeup.toFixed(1)}dB`} onValueChange={(v) => setFx('compressor', { makeup: v })} />
              </div>
            </div>
          </div>
        )}

        {/* EQ canvas always in DOM for views.ts bootstrap; hidden when not on EQ tab */}
        <canvas
          className="fx-eq-canvas"
          id="fx-eq-canvas"
          width="560"
          height="100"
          style={activeTab !== 'eq' ? { display: 'none' } : undefined}
        ></canvas>
      </div>
    </div>
  );
}
