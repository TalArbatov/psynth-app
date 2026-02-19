import { useEffect, useRef } from 'react';
import { createKnob } from '../../modules/knob.js';
import { registerKnob } from '../../modules/knob-registry.js';
import type { KnobInstance } from '../../modules/types.js';
import type { ModDestination, ModSource } from '../../models/patch.js';
import { MOD_SOURCE_COLORS } from '../../models/mod-destinations.js';
import { usePatch, useModRoutingsFor } from '../../context/PatchContext';

type ModKnobControlProps = {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  displayValue: string;
  modDestination?: ModDestination;
  onValueChange: (value: number) => void;
};

let nextRoutingId = 1;

export function ModKnobControl({
  id,
  min,
  max,
  step,
  value,
  disabled = false,
  displayValue,
  modDestination,
  onValueChange,
}: ModKnobControlProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const knobRef = useRef<KnobInstance | null>(null);

  const { dispatch, dragSource } = usePatch();
  const routings = modDestination ? useModRoutingsFor(modDestination) : [];

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
  }, [id, max, min, step, value]);

  useEffect(() => {
    const knob = knobRef.current;
    const input = inputRef.current;
    if (!knob || !input) return;
    knob.setValue(value);
    input.value = String(value);
  }, [value]);

  useEffect(() => {
    knobRef.current?.setEnabled(!disabled);
  }, [disabled]);

  // Update mod rings when routings change
  useEffect(() => {
    if (!knobRef.current) return;
    const rings = routings.map((r) => ({
      amount: r.amount,
      color: MOD_SOURCE_COLORS[r.source] ?? '#00d2ff',
    }));
    knobRef.current.setModRings(rings);
  }, [routings]);

  const isDropTarget = !!dragSource && !!modDestination;

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!modDestination || !dragSource) return;

    // Check if routing already exists
    const existing = routings.find((r) => r.source === dragSource);
    if (existing) return;

    dispatch({
      type: 'ADD_MOD_ROUTING',
      routing: {
        id: `mod-${nextRoutingId++}`,
        source: dragSource,
        destination: modDestination,
        amount: 0.5,
      },
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!modDestination || routings.length === 0) return;
    e.preventDefault();
    // Remove the last routing for this destination
    const lastRouting = routings[routings.length - 1];
    dispatch({ type: 'REMOVE_MOD_ROUTING', id: lastRouting.id });
  };

  return (
    <div
      className={`mod-knob-wrap${isDropTarget ? ' mod-drop-target' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      <canvas ref={canvasRef} className="knob-canvas" id={`${id}-knob`} width={56} height={64}></canvas>
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
    </div>
  );
}
