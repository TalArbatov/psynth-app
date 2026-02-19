import { useCallback, useEffect, useRef, useState } from 'react';
import { StepSequencer, createDefaultSteps } from '../../modules/step-sequencer.js';
import type { Step, StepCount } from '../../modules/step-sequencer.js';
import type { SynthRuntime } from '../../application/synth/runtime.js';
import type { SyncClient } from '../../modules/sync.js';
import type { SyncMessage } from '../../modules/types.js';
import { NOTE_NAMES } from '../../modules/constants.js';

const OCTAVES = [2, 3, 4, 5, 6];
const ALL_NOTES: string[] = [];
for (const oct of OCTAVES) {
  for (const name of NOTE_NAMES) {
    ALL_NOTES.push(`${name}${oct}`);
  }
}

/** Send a sequencer sync message, guarded by the sync client's receiving flag. */
function syncSend(sync: SyncClient | null, msg: SyncMessage): void {
  sync?.send(msg);
}

export function SequencerPage({ runtime, active }: { runtime: SynthRuntime | null; active: boolean }) {
  const seqRef = useRef<StepSequencer | null>(null);
  const syncRef = useRef<SyncClient | null>(null);
  const stepsRef = useRef<Step[]>(createDefaultSteps(16));

  const [steps, setSteps] = useState<Step[]>(stepsRef.current);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [stepCount, setStepCount] = useState<StepCount>(16);

  // Keep refs in sync with state
  stepsRef.current = steps;
  syncRef.current = runtime?.sync ?? null;

  // Create sequencer instance when runtime becomes available
  useEffect(() => {
    if (!runtime || seqRef.current) return;
    seqRef.current = new StepSequencer(runtime.engine);
  }, [runtime]);

  // Poll playhead position via rAF instead of calling setState from the
  // scheduler's setInterval — avoids expensive re-renders on the audio thread.
  useEffect(() => {
    if (!playing) return;
    let rafId: number;
    function tick() {
      const seq = seqRef.current;
      if (seq) setCurrentStep(seq.currentStep);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing]);

  // Push step data to the sequencer engine whenever React state changes.
  // Uses updateStep for single-step edits (avoids replacing the whole array).
  useEffect(() => {
    seqRef.current?.setSteps([...steps]);
  }, [steps]);

  // Register sync receive handler
  useEffect(() => {
    if (!runtime) return;
    runtime.sync.onMessage((msg) => {
      if (msg.t === 'seqStep') {
        setSteps(prev => {
          const next = [...prev];
          if (msg.i >= 0 && msg.i < next.length) {
            next[msg.i] = {
              enabled: msg.enabled,
              note: msg.note,
              velocity: msg.velocity,
              gate: msg.gate,
            };
          }
          return next;
        });
      } else if (msg.t === 'seqPlay') {
        seqRef.current?.play();
        setPlaying(true);
      } else if (msg.t === 'seqStop') {
        seqRef.current?.stop();
        setPlaying(false);
        setCurrentStep(0);
      } else if (msg.t === 'seqBpm') {
        setBpm(msg.v);
        seqRef.current?.setBpm(msg.v);
      } else if (msg.t === 'seqSwing') {
        setSwing(msg.v);
        seqRef.current?.setSwing(msg.v);
      } else if (msg.t === 'seqStepCount') {
        const count = msg.v as StepCount;
        setStepCount(count);
        seqRef.current?.setStepCount(count);
        setSteps(prev => {
          if (prev.length < count) {
            return [...prev, ...createDefaultSteps(count - prev.length)];
          }
          return prev.slice(0, count);
        });
      }
    });
  }, [runtime]);

  // ── User action handlers (update state + send sync) ──

  const toggleStep = useCallback((index: number) => {
    const s = stepsRef.current[index];
    const newStep = { ...s, enabled: !s.enabled };
    setSteps(prev => {
      const next = [...prev];
      next[index] = newStep;
      return next;
    });
    syncSend(syncRef.current, { t: 'seqStep', i: index, ...newStep });
  }, []);

  const setStepNote = useCallback((index: number, note: string) => {
    const s = stepsRef.current[index];
    const newStep = { ...s, note };
    setSteps(prev => {
      const next = [...prev];
      next[index] = newStep;
      return next;
    });
    syncSend(syncRef.current, { t: 'seqStep', i: index, ...newStep });
  }, []);

  const setStepVelocity = useCallback((index: number, velocity: number) => {
    const s = stepsRef.current[index];
    const newStep = { ...s, velocity };
    setSteps(prev => {
      const next = [...prev];
      next[index] = newStep;
      return next;
    });
    syncSend(syncRef.current, { t: 'seqStep', i: index, ...newStep });
  }, []);

  const setStepGate = useCallback((index: number, gate: number) => {
    const s = stepsRef.current[index];
    const newStep = { ...s, gate };
    setSteps(prev => {
      const next = [...prev];
      next[index] = newStep;
      return next;
    });
    syncSend(syncRef.current, { t: 'seqStep', i: index, ...newStep });
  }, []);

  const handlePlayStop = useCallback(() => {
    const seq = seqRef.current;
    if (!seq) return;
    if (seq.playing) {
      seq.stop();
      setPlaying(false);
      setCurrentStep(0);
      syncSend(syncRef.current, { t: 'seqStop' });
    } else {
      seq.play();
      setPlaying(true);
      syncSend(syncRef.current, { t: 'seqPlay' });
    }
  }, []);

  const handleBpmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val >= 20 && val <= 300) {
      setBpm(val);
      seqRef.current?.setBpm(val);
      syncSend(syncRef.current, { t: 'seqBpm', v: val });
    }
  }, []);

  const handleSwingChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSwing(val);
    seqRef.current?.setSwing(val);
    syncSend(syncRef.current, { t: 'seqSwing', v: val });
  }, []);

  const handleStepCountChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10) as StepCount;
    setStepCount(val);
    seqRef.current?.setStepCount(val);
    setSteps(prev => {
      if (prev.length < val) {
        return [...prev, ...createDefaultSteps(val - prev.length)];
      }
      return prev.slice(0, val);
    });
    syncSend(syncRef.current, { t: 'seqStepCount', v: val });
  }, []);

  const visibleSteps = steps.slice(0, stepCount);

  return (
    <div className={`main-page${active ? ' active' : ''}`} id="page-seq">
      <div className="synth-body">
        {/* Transport bar */}
        <div className="seq-transport">
          <button
            className={`seq-play-btn${playing ? ' playing' : ''}`}
            onClick={handlePlayStop}
          >
            {playing ? 'Stop' : 'Play'}
          </button>

          <div className="seq-param">
            <label>BPM</label>
            <input
              type="number"
              className="seq-number-input"
              value={bpm}
              min={20}
              max={300}
              onChange={handleBpmChange}
            />
          </div>

          <div className="seq-param">
            <label>Swing</label>
            <input
              type="range"
              className="seq-range"
              min={0}
              max={0.6}
              step={0.05}
              value={swing}
              onChange={handleSwingChange}
            />
            <span className="seq-param-value">{Math.round(swing * 100)}%</span>
          </div>

          <div className="seq-param">
            <label>Steps</label>
            <select
              className="seq-select"
              value={stepCount}
              onChange={handleStepCountChange}
            >
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
          </div>
        </div>

        {/* Step grid */}
        <div className="seq-grid" style={{ gridTemplateColumns: `repeat(${stepCount}, 1fr)` }}>
          {visibleSteps.map((step, i) => (
            <div
              key={i}
              className={
                `seq-step` +
                (step.enabled ? ' enabled' : '') +
                (playing && currentStep === i ? ' active' : '') +
                (i % 4 === 0 ? ' bar-start' : '')
              }
            >
              <div className="seq-step-num">{i + 1}</div>
              <button
                className={`seq-step-toggle${step.enabled ? ' on' : ''}`}
                onClick={() => toggleStep(i)}
              />
              <select
                className="seq-note-select"
                value={step.note}
                onChange={(e) => setStepNote(i, e.target.value)}
              >
                {ALL_NOTES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="seq-step-params">
                <label>Vel</label>
                <input
                  type="range"
                  className="seq-mini-range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={step.velocity}
                  onChange={(e) => setStepVelocity(i, parseFloat(e.target.value))}
                />
              </div>
              <div className="seq-step-params">
                <label>Gate</label>
                <input
                  type="range"
                  className="seq-mini-range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={step.gate}
                  onChange={(e) => setStepGate(i, parseFloat(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
