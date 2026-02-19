import type { KnobInstance, KnobOptions } from './types.js';

export function createKnob(
  canvas: HTMLCanvasElement,
  hiddenInput: HTMLInputElement,
  opts: KnobOptions
): KnobInstance {
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) throw new Error('2D context is required for knob rendering.');
  const ctx: CanvasRenderingContext2D = tempCtx;
  const { min, max, step, onChange, formatLabel } = opts;
  let value = opts.value ?? 0;
  let enabled = true;
  let modRings: Array<{ amount: number; color: string }> = [];

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 6;

  // Proportional sizing based on radius
  const arcWidth = Math.max(2, Math.round(radius * 0.16));
  const dotRadius = Math.max(3, Math.round(radius * 0.2));
  const dotStroke = Math.max(1, Math.round(radius * 0.08));

  // Arc sweep: 270° with gap at bottom
  const startAngle = Math.PI * 0.75;   // 135°
  const endAngle = Math.PI * 2.25;     // 405° (= 45°)
  const sweep = endAngle - startAngle; // 270°

  function valueFrac(): number {
    return (value - min) / (max - min);
  }

  function draw(): void {
    ctx.clearRect(0, 0, w, h);

    // Track (background arc)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = '#2a2a34';
    ctx.lineWidth = arcWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    const frac = valueFrac();
    const valAngle = startAngle + frac * sweep;
    if (frac > 0.001) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, valAngle);
      ctx.strokeStyle = enabled ? '#00d2ff' : '#444';
      ctx.lineWidth = arcWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Indicator dot
    const dotX = cx + Math.cos(valAngle) * radius;
    const dotY = cy + Math.sin(valAngle) * radius;
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = enabled ? '#00d2ff' : '#444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = dotStroke;
    ctx.stroke();

    // Center label (only if formatLabel provided)
    if (formatLabel) {
      ctx.fillStyle = '#5a5a65';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatLabel(value), cx, cy);
    }

    // Mod rings
    for (let i = 0; i < modRings.length; i++) {
      const ring = modRings[i];
      const r = radius + (i + 1) * (arcWidth + 1);
      const ringFrac = Math.abs(ring.amount);
      if (ringFrac < 0.001) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + ringFrac * sweep);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = Math.max(1, arcWidth - 1);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Dimmed overlay when disabled
    if (!enabled) {
      ctx.fillStyle = 'rgba(17,17,20,0.45)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  function setValue(v: number): void {
    value = Math.max(min, Math.min(max, v));
    value = Math.round(value / step) * step;
    draw();
  }

  function commitValue(): void {
    hiddenInput.value = String(value);
    hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
    if (onChange) onChange(value);
  }

  function setEnabled(flag: boolean): void {
    enabled = flag;
    canvas.style.cursor = flag ? 'grab' : 'not-allowed';
    draw();
  }

  function setModRings(rings: Array<{ amount: number; color: string }>): void {
    modRings = rings;
    draw();
  }

  // --- Mouse interaction ---
  let dragging = false;
  let dragStartY = 0;
  let dragStartValue = 0;

  canvas.addEventListener('mousedown', e => {
    if (!enabled) return;
    dragging = true;
    dragStartY = e.clientY;
    dragStartValue = value;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dy = dragStartY - e.clientY; // up = positive
    const range = max - min;
    const sensitivity = range / 150; // 150px for full range
    setValue(dragStartValue + dy * sensitivity);
    commitValue();
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      canvas.style.cursor = enabled ? 'grab' : 'not-allowed';
    }
  });

  // --- Touch interaction ---
  canvas.addEventListener('touchstart', e => {
    if (!enabled) return;
    const t = e.touches[0];
    if (!t) return;
    dragging = true;
    dragStartY = t.clientY;
    dragStartValue = value;
    e.preventDefault();
  });

  canvas.addEventListener('touchmove', e => {
    if (!dragging) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    const dy = dragStartY - t.clientY;
    const range = max - min;
    const sensitivity = range / 150;
    setValue(dragStartValue + dy * sensitivity);
    commitValue();
  });

  window.addEventListener('touchend', () => {
    dragging = false;
  });

  // Initialize
  hiddenInput.value = String(value);
  draw();

  return { draw, setValue, setEnabled, setModRings };
}
