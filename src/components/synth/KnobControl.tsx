import { useEffect, useRef } from 'react';
import { createKnob } from '../../modules/knob.js';
import { registerKnob, unregisterKnob } from '../../modules/knob-registry.js';
import type { KnobInstance } from '../../modules/types.js';

type KnobControlProps = {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  displayValue: string;
  onValueChange: (value: number) => void;
};

/**
 * Reusable canvas knob that preserves the legacy hidden-input DOM contract.
 * The hidden input keeps sync handlers and knob registry integration intact.
 */
export function KnobControl({
  id,
  min,
  max,
  step,
  value,
  disabled = false,
  displayValue,
  onValueChange,
}: KnobControlProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const knobRef = useRef<KnobInstance | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const input = inputRef.current;
    if (!canvas || !input || knobRef.current) return;

    const knob = createKnob(canvas, input, {
      min,
      max,
      step,
      value,
    });

    knobRef.current = knob;
    registerKnob(id, knob);

    return () => {
      knob.destroy?.();
      unregisterKnob(id);
      knobRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, min, max, step]);

  useEffect(() => {
    const knob = knobRef.current;
    const input = inputRef.current;
    if (!knob || !input) return;
    // Skip redundant feedback while the user is actively dragging —
    // the knob already updated itself imperatively in the mousemove handler.
    if (knob.isDragging()) return;
    knob.setValue(value);
    input.value = String(value);
  }, [value]);

  useEffect(() => {
    knobRef.current?.setEnabled(!disabled);
  }, [disabled]);

  return (
    <>
      <canvas ref={canvasRef} className="knob-canvas" id={`${id}-knob`} width={48} height={56}></canvas>
      <input
        ref={inputRef}
        type="hidden"
        id={id}
        value={value}
        onInput={(e) => {
          const nextValue = Number.parseFloat((e.currentTarget as HTMLInputElement).value);
          if (!Number.isNaN(nextValue)) {
            onValueChange(nextValue);
          }
        }}
        readOnly
      />
      <div className="value-display" id={`${id}-val`}>{displayValue}</div>
    </>
  );
}
