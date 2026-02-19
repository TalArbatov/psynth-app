import { useEffect, useState } from 'react';
import type { SynthRuntime } from '../../application/synth/runtime.js';
import type {
  ChorusParams,
  CompressorParams,
  DelayParams,
  EQParams,
  ReverbParams,
  SaturationParams,
} from '../../modules/types.js';
import { KnobControl } from './KnobControl';

type ToggleState = {
  saturation: boolean;
  eq: boolean;
  chorus: boolean;
  delay: boolean;
  reverb: boolean;
  compressor: boolean;
  delayPP: boolean;
};

type FxValues = {
  satType: NonNullable<SaturationParams['type']>;
  satDrive: number;
  satOutput: number;
  satTone: number;
  satMix: number;

  eqHp: number;
  eqBandFreq: number;
  eqBandGain: number;
  eqBandQ: number;
  eqShelfFreq: number;
  eqShelfGain: number;

  chorusRate: number;
  chorusDepth: number;
  chorusDelay: number;
  chorusSpread: number;
  chorusMix: number;

  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  delayFilter: number;

  reverbSize: number;
  reverbPredelay: number;
  reverbDamping: number;
  reverbMix: number;

  compThreshold: number;
  compRatio: number;
  compAttack: number;
  compRelease: number;
  compMakeup: number;
};

const INITIAL_TOGGLES: ToggleState = {
  saturation: false,
  eq: false,
  chorus: false,
  delay: false,
  reverb: false,
  compressor: false,
  delayPP: false,
};

const INITIAL_VALUES: FxValues = {
  satType: 'soft',
  satDrive: 1,
  satOutput: 0.5,
  satTone: 4000,
  satMix: 1,

  eqHp: 20,
  eqBandFreq: 1000,
  eqBandGain: 0,
  eqBandQ: 1,
  eqShelfFreq: 8000,
  eqShelfGain: 0,

  chorusRate: 0.8,
  chorusDepth: 2,
  chorusDelay: 10,
  chorusSpread: 50,
  chorusMix: 0.5,

  delayTime: 300,
  delayFeedback: 0.3,
  delayMix: 0.3,
  delayFilter: 5000,

  reverbSize: 2,
  reverbPredelay: 10,
  reverbDamping: 8000,
  reverbMix: 0.3,

  compThreshold: -24,
  compRatio: 4,
  compAttack: 0.003,
  compRelease: 0.25,
  compMakeup: 0,
};

/**
 * React-managed FX controls. This replaces imperative DOM binders by mapping
 * every control to explicit state transitions + effect API calls.
 */
export function FxPage({ runtime, active, activePresetData, resetCount }: { runtime: SynthRuntime | null; active: boolean; activePresetData: Record<string, any> | null; resetCount: number }) {
  const [toggles, setToggles] = useState<ToggleState>(INITIAL_TOGGLES);
  const [values, setValues] = useState<FxValues>(INITIAL_VALUES);

  useEffect(() => {
    if (!runtime) return;
    runtime.fxChain.saturation.set({
      type: values.satType,
      drive: values.satDrive,
      output: values.satOutput,
      tone: values.satTone,
      mix: values.satMix,
    });
    runtime.fxChain.eq.set({
      hpFreq: values.eqHp,
      bandFreq: values.eqBandFreq,
      bandGain: values.eqBandGain,
      bandQ: values.eqBandQ,
      shelfFreq: values.eqShelfFreq,
      shelfGain: values.eqShelfGain,
    });
    runtime.fxChain.chorus.set({
      rate: values.chorusRate,
      depth: values.chorusDepth,
      delay: values.chorusDelay,
      spread: values.chorusSpread,
      mix: values.chorusMix,
    });
    runtime.fxChain.delay.set({
      time: values.delayTime,
      feedback: values.delayFeedback,
      mix: values.delayMix,
      filterFreq: values.delayFilter,
      pingPong: toggles.delayPP,
    });
    runtime.fxChain.reverb.set({
      size: values.reverbSize,
      preDelay: values.reverbPredelay,
      damping: values.reverbDamping,
      mix: values.reverbMix,
    });
    runtime.fxChain.compressor.set({
      threshold: values.compThreshold,
      ratio: values.compRatio,
      attack: values.compAttack,
      release: values.compRelease,
      makeup: values.compMakeup,
    });
  }, [runtime]); // apply defaults once runtime appears

  // Apply loaded preset data to FX state + runtime
  useEffect(() => {
    if (!activePresetData?.fx) return;
    const fx = activePresetData.fx as any;

    setToggles({
      saturation: fx.saturation.enabled,
      eq: fx.eq.enabled,
      chorus: fx.chorus.enabled,
      delay: fx.delay.enabled,
      reverb: fx.reverb.enabled,
      compressor: fx.compressor.enabled,
      delayPP: fx.delay.pingPong,
    });

    setValues({
      satType: fx.saturation.type, satDrive: fx.saturation.drive,
      satOutput: fx.saturation.output, satTone: fx.saturation.tone, satMix: fx.saturation.mix,
      eqHp: fx.eq.hpFreq, eqBandFreq: fx.eq.bandFreq, eqBandGain: fx.eq.bandGain,
      eqBandQ: fx.eq.bandQ, eqShelfFreq: fx.eq.shelfFreq, eqShelfGain: fx.eq.shelfGain,
      chorusRate: fx.chorus.rate, chorusDepth: fx.chorus.depth, chorusDelay: fx.chorus.delay,
      chorusSpread: fx.chorus.spread, chorusMix: fx.chorus.mix,
      delayTime: fx.delay.time, delayFeedback: fx.delay.feedback,
      delayMix: fx.delay.mix, delayFilter: fx.delay.filterFreq,
      reverbSize: fx.reverb.size, reverbPredelay: fx.reverb.preDelay,
      reverbDamping: fx.reverb.damping, reverbMix: fx.reverb.mix,
      compThreshold: fx.compressor.threshold, compRatio: fx.compressor.ratio,
      compAttack: fx.compressor.attack, compRelease: fx.compressor.release,
      compMakeup: fx.compressor.makeup,
    });

    if (runtime) {
      runtime.fxChain.saturation.setEnabled(fx.saturation.enabled);
      runtime.fxChain.saturation.set({ type: fx.saturation.type, drive: fx.saturation.drive, output: fx.saturation.output, tone: fx.saturation.tone, mix: fx.saturation.mix });
      runtime.fxChain.eq.setEnabled(fx.eq.enabled);
      runtime.fxChain.eq.set({ hpFreq: fx.eq.hpFreq, bandFreq: fx.eq.bandFreq, bandGain: fx.eq.bandGain, bandQ: fx.eq.bandQ, shelfFreq: fx.eq.shelfFreq, shelfGain: fx.eq.shelfGain });
      runtime.fxChain.chorus.setEnabled(fx.chorus.enabled);
      runtime.fxChain.chorus.set({ rate: fx.chorus.rate, depth: fx.chorus.depth, delay: fx.chorus.delay, spread: fx.chorus.spread, mix: fx.chorus.mix });
      runtime.fxChain.delay.setEnabled(fx.delay.enabled);
      runtime.fxChain.delay.set({ time: fx.delay.time, feedback: fx.delay.feedback, mix: fx.delay.mix, pingPong: fx.delay.pingPong, filterFreq: fx.delay.filterFreq });
      runtime.fxChain.reverb.setEnabled(fx.reverb.enabled);
      runtime.fxChain.reverb.set({ size: fx.reverb.size, preDelay: fx.reverb.preDelay, damping: fx.reverb.damping, mix: fx.reverb.mix });
      runtime.fxChain.compressor.setEnabled(fx.compressor.enabled);
      runtime.fxChain.compressor.set({ threshold: fx.compressor.threshold, ratio: fx.compressor.ratio, attack: fx.compressor.attack, release: fx.compressor.release, makeup: fx.compressor.makeup });
    }
  }, [activePresetData, resetCount]);

  const setParam = <K extends keyof FxValues>(key: K, value: FxValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFx = (key: keyof ToggleState, apply: (enabled: boolean) => void) => {
    setToggles((prev) => {
      const enabled = !prev[key];
      apply(enabled);
      return { ...prev, [key]: enabled };
    });
  };

  const applySat = (params: SaturationParams) => runtime?.fxChain.saturation.set(params);
  const applyEq = (params: EQParams) => runtime?.fxChain.eq.set(params);
  const applyChorus = (params: ChorusParams) => runtime?.fxChain.chorus.set(params);
  const applyDelay = (params: DelayParams) => runtime?.fxChain.delay.set(params);
  const applyReverb = (params: ReverbParams) => runtime?.fxChain.reverb.set(params);
  const applyComp = (params: CompressorParams) => runtime?.fxChain.compressor.set(params);

  return (
    <div className={`main-page${active ? ' active' : ''}`} id="page-fx">
      <div className="synth-body">
        <div className={`fx-unit${toggles.saturation ? ' active' : ''}`} id="fx-saturation">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Saturation</span>
            <button
              className={`fx-toggle ${toggles.saturation ? 'on' : 'off'}`}
              id="fx-saturation-toggle"
              onClick={() => toggleFx('saturation', (on) => runtime?.fxChain.saturation.setEnabled(on))}
            >
              {toggles.saturation ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Type</label>
                <select
                  id="fx-sat-type"
                  value={values.satType}
                  onChange={(e) => {
                    const type = e.target.value as NonNullable<SaturationParams['type']>;
                    setParam('satType', type);
                    applySat({ type });
                  }}
                >
                  <option value="soft">Soft</option>
                  <option value="hard">Hard</option>
                  <option value="wave">Wave</option>
                </select>
              </div>
              <div className="control-group">
                <label>Drive</label>
                <KnobControl
                  id="fx-sat-drive"
                  min={1}
                  max={100}
                  step={1}
                  value={values.satDrive}
                  displayValue={`${Math.round(values.satDrive)}`}
                  onValueChange={(v) => {
                    setParam('satDrive', v);
                    applySat({ drive: v });
                  }}
                />
              </div>
              <div className="control-group">
                <label>Output</label>
                <KnobControl
                  id="fx-sat-output"
                  min={0}
                  max={1}
                  step={0.01}
                  value={values.satOutput}
                  displayValue={values.satOutput.toFixed(2)}
                  onValueChange={(v) => {
                    setParam('satOutput', v);
                    applySat({ output: v });
                  }}
                />
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Tone</label>
                <KnobControl
                  id="fx-sat-tone"
                  min={200}
                  max={8000}
                  step={10}
                  value={values.satTone}
                  displayValue={`${Math.round(values.satTone)} Hz`}
                  onValueChange={(v) => {
                    setParam('satTone', v);
                    applySat({ tone: v });
                  }}
                />
              </div>
              <div className="control-group">
                <label>Mix</label>
                <KnobControl
                  id="fx-sat-mix"
                  min={0}
                  max={1}
                  step={0.01}
                  value={values.satMix}
                  displayValue={values.satMix.toFixed(2)}
                  onValueChange={(v) => {
                    setParam('satMix', v);
                    applySat({ mix: v });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.eq ? ' active' : ''}`} id="fx-eq">
          <div className="fx-unit-header">
            <span className="fx-unit-label">EQ</span>
            <button
              className={`fx-toggle ${toggles.eq ? 'on' : 'off'}`}
              id="fx-eq-toggle"
              onClick={() => toggleFx('eq', (on) => runtime?.fxChain.eq.setEnabled(on))}
            >
              {toggles.eq ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>HP Freq</label>
                <KnobControl
                  id="fx-eq-hp"
                  min={20}
                  max={2000}
                  step={1}
                  value={values.eqHp}
                  displayValue={`${Math.round(values.eqHp)} Hz`}
                  onValueChange={(v) => {
                    setParam('eqHp', v);
                    applyEq({ hpFreq: v });
                  }}
                />
              </div>
              <div className="control-group">
                <label>Band Freq</label>
                <KnobControl
                  id="fx-eq-band-freq"
                  min={100}
                  max={10000}
                  step={10}
                  value={values.eqBandFreq}
                  displayValue={`${Math.round(values.eqBandFreq)} Hz`}
                  onValueChange={(v) => {
                    setParam('eqBandFreq', v);
                    applyEq({ bandFreq: v });
                  }}
                />
              </div>
              <div className="control-group">
                <label>Band Gain</label>
                <KnobControl
                  id="fx-eq-band-gain"
                  min={-24}
                  max={24}
                  step={0.5}
                  value={values.eqBandGain}
                  displayValue={`${values.eqBandGain.toFixed(1)} dB`}
                  onValueChange={(v) => {
                    setParam('eqBandGain', v);
                    applyEq({ bandGain: v });
                  }}
                />
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Band Q</label>
                <KnobControl
                  id="fx-eq-band-q"
                  min={0.1}
                  max={18}
                  step={0.1}
                  value={values.eqBandQ}
                  displayValue={values.eqBandQ.toFixed(1)}
                  onValueChange={(v) => {
                    setParam('eqBandQ', v);
                    applyEq({ bandQ: v });
                  }}
                />
              </div>
              <div className="control-group">
                <label>Shelf Freq</label>
                <KnobControl
                  id="fx-eq-shelf-freq"
                  min={1000}
                  max={16000}
                  step={100}
                  value={values.eqShelfFreq}
                  displayValue={`${Math.round(values.eqShelfFreq)} Hz`}
                  onValueChange={(v) => {
                    setParam('eqShelfFreq', v);
                    applyEq({ shelfFreq: v });
                  }}
                />
              </div>
              <div className="control-group">
                <label>Shelf Gain</label>
                <KnobControl
                  id="fx-eq-shelf-gain"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={values.eqShelfGain}
                  displayValue={`${values.eqShelfGain.toFixed(1)} dB`}
                  onValueChange={(v) => {
                    setParam('eqShelfGain', v);
                    applyEq({ shelfGain: v });
                  }}
                />
              </div>
            </div>
            <canvas className="fx-eq-canvas" id="fx-eq-canvas" width="560" height="120"></canvas>
          </div>
        </div>

        <div className={`fx-unit${toggles.chorus ? ' active' : ''}`} id="fx-chorus">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Chorus</span>
            <button
              className={`fx-toggle ${toggles.chorus ? 'on' : 'off'}`}
              id="fx-chorus-toggle"
              onClick={() => toggleFx('chorus', (on) => runtime?.fxChain.chorus.setEnabled(on))}
            >
              {toggles.chorus ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Rate (Hz)</label>
                <KnobControl id="fx-chorus-rate" min={0.1} max={5} step={0.1} value={values.chorusRate} displayValue={values.chorusRate.toFixed(1)} onValueChange={(v) => { setParam('chorusRate', v); applyChorus({ rate: v }); }} />
              </div>
              <div className="control-group">
                <label>Depth (ms)</label>
                <KnobControl id="fx-chorus-depth" min={0} max={20} step={0.5} value={values.chorusDepth} displayValue={values.chorusDepth.toFixed(1)} onValueChange={(v) => { setParam('chorusDepth', v); applyChorus({ depth: v }); }} />
              </div>
              <div className="control-group">
                <label>Delay (ms)</label>
                <KnobControl id="fx-chorus-delay" min={1} max={30} step={0.5} value={values.chorusDelay} displayValue={values.chorusDelay.toFixed(1)} onValueChange={(v) => { setParam('chorusDelay', v); applyChorus({ delay: v }); }} />
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Spread</label>
                <KnobControl id="fx-chorus-spread" min={0} max={100} step={1} value={values.chorusSpread} displayValue={`${Math.round(values.chorusSpread)}%`} onValueChange={(v) => { setParam('chorusSpread', v); applyChorus({ spread: v }); }} />
              </div>
              <div className="control-group">
                <label>Mix</label>
                <KnobControl id="fx-chorus-mix" min={0} max={1} step={0.01} value={values.chorusMix} displayValue={values.chorusMix.toFixed(2)} onValueChange={(v) => { setParam('chorusMix', v); applyChorus({ mix: v }); }} />
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.delay ? ' active' : ''}`} id="fx-delay">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Delay</span>
            <button
              className={`fx-toggle ${toggles.delay ? 'on' : 'off'}`}
              id="fx-delay-toggle"
              onClick={() => toggleFx('delay', (on) => runtime?.fxChain.delay.setEnabled(on))}
            >
              {toggles.delay ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Time (ms)</label>
                <KnobControl id="fx-delay-time" min={1} max={2000} step={1} value={values.delayTime} displayValue={`${Math.round(values.delayTime)}`} onValueChange={(v) => { setParam('delayTime', v); applyDelay({ time: v }); }} />
              </div>
              <div className="control-group">
                <label>Feedback</label>
                <KnobControl id="fx-delay-feedback" min={0} max={0.95} step={0.01} value={values.delayFeedback} displayValue={values.delayFeedback.toFixed(2)} onValueChange={(v) => { setParam('delayFeedback', v); applyDelay({ feedback: v }); }} />
              </div>
              <div className="control-group">
                <label>Mix</label>
                <KnobControl id="fx-delay-mix" min={0} max={1} step={0.01} value={values.delayMix} displayValue={values.delayMix.toFixed(2)} onValueChange={(v) => { setParam('delayMix', v); applyDelay({ mix: v }); }} />
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Ping-Pong</label>
                <button
                  className={`fx-toggle ${toggles.delayPP ? 'on' : 'off'}`}
                  id="fx-delay-pp"
                  onClick={() =>
                    toggleFx('delayPP', (on) => {
                      applyDelay({ pingPong: on });
                    })
                  }
                >
                  {toggles.delayPP ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="control-group">
                <label>Filter</label>
                <KnobControl id="fx-delay-filter" min={200} max={12000} step={100} value={values.delayFilter} displayValue={`${Math.round(values.delayFilter)} Hz`} onValueChange={(v) => { setParam('delayFilter', v); applyDelay({ filterFreq: v }); }} />
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.reverb ? ' active' : ''}`} id="fx-reverb">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Reverb</span>
            <button
              className={`fx-toggle ${toggles.reverb ? 'on' : 'off'}`}
              id="fx-reverb-toggle"
              onClick={() => toggleFx('reverb', (on) => runtime?.fxChain.reverb.setEnabled(on))}
            >
              {toggles.reverb ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Size (s)</label>
                <KnobControl id="fx-reverb-size" min={0.1} max={8} step={0.1} value={values.reverbSize} displayValue={values.reverbSize.toFixed(1)} onValueChange={(v) => { setParam('reverbSize', v); applyReverb({ size: v }); }} />
              </div>
              <div className="control-group">
                <label>Pre-delay (ms)</label>
                <KnobControl id="fx-reverb-predelay" min={0} max={100} step={1} value={values.reverbPredelay} displayValue={`${Math.round(values.reverbPredelay)}`} onValueChange={(v) => { setParam('reverbPredelay', v); applyReverb({ preDelay: v }); }} />
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Damping</label>
                <KnobControl id="fx-reverb-damping" min={1000} max={16000} step={100} value={values.reverbDamping} displayValue={`${Math.round(values.reverbDamping)} Hz`} onValueChange={(v) => { setParam('reverbDamping', v); applyReverb({ damping: v }); }} />
              </div>
              <div className="control-group">
                <label>Mix</label>
                <KnobControl id="fx-reverb-mix" min={0} max={1} step={0.01} value={values.reverbMix} displayValue={values.reverbMix.toFixed(2)} onValueChange={(v) => { setParam('reverbMix', v); applyReverb({ mix: v }); }} />
              </div>
            </div>
          </div>
        </div>

        <div className={`fx-unit${toggles.compressor ? ' active' : ''}`} id="fx-compressor">
          <div className="fx-unit-header">
            <span className="fx-unit-label">Compressor</span>
            <button
              className={`fx-toggle ${toggles.compressor ? 'on' : 'off'}`}
              id="fx-compressor-toggle"
              onClick={() => toggleFx('compressor', (on) => runtime?.fxChain.compressor.setEnabled(on))}
            >
              {toggles.compressor ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="fx-unit-body">
            <div className="controls">
              <div className="control-group">
                <label>Threshold</label>
                <KnobControl id="fx-comp-threshold" min={-60} max={0} step={1} value={values.compThreshold} displayValue={`${Math.round(values.compThreshold)} dB`} onValueChange={(v) => { setParam('compThreshold', v); applyComp({ threshold: v }); }} />
              </div>
              <div className="control-group">
                <label>Ratio</label>
                <KnobControl id="fx-comp-ratio" min={1} max={20} step={0.5} value={values.compRatio} displayValue={values.compRatio.toFixed(1)} onValueChange={(v) => { setParam('compRatio', v); applyComp({ ratio: v }); }} />
              </div>
              <div className="control-group">
                <label>Attack</label>
                <KnobControl id="fx-comp-attack" min={0.001} max={0.1} step={0.001} value={values.compAttack} displayValue={`${Math.round(values.compAttack * 1000)} ms`} onValueChange={(v) => { setParam('compAttack', v); applyComp({ attack: v }); }} />
              </div>
            </div>
            <div className="controls">
              <div className="control-group">
                <label>Release</label>
                <KnobControl id="fx-comp-release" min={0.01} max={1} step={0.01} value={values.compRelease} displayValue={`${Math.round(values.compRelease * 1000)} ms`} onValueChange={(v) => { setParam('compRelease', v); applyComp({ release: v }); }} />
              </div>
              <div className="control-group">
                <label>Makeup (dB)</label>
                <KnobControl id="fx-comp-makeup" min={0} max={24} step={0.5} value={values.compMakeup} displayValue={`${values.compMakeup.toFixed(1)} dB`} onValueChange={(v) => { setParam('compMakeup', v); applyComp({ makeup: v }); }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
