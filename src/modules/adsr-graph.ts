import { ADSR_MAX } from './constants.js';
import type { ADSR, Drawable } from './types.js';

interface Point {
  x: number;
  y: number;
}

type DragHandle = 1 | 2 | 4;

export function createADSRGraph(
  canvas: HTMLCanvasElement,
  valuesEl: HTMLElement,
  adsr: ADSR,
  onChange?: () => void
): Drawable {
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('2D context is required for ADSR graph.');
  }
  const ctx: CanvasRenderingContext2D = tempCtx;

  const pad = { top: 14, bottom: 20, left: 8, right: 8 };
  const plotW = canvas.width - pad.left - pad.right;
  const plotH = canvas.height - pad.top - pad.bottom;

  const zonePcts = { a: 0.25, d: 0.25, s: 0.20, r: 0.30 };
  const zones = {
    a: { start: 0, width: zonePcts.a * plotW },
    d: { start: zonePcts.a * plotW, width: zonePcts.d * plotW },
    s: { start: (zonePcts.a + zonePcts.d) * plotW, width: zonePcts.s * plotW },
    r: { start: (zonePcts.a + zonePcts.d + zonePcts.s) * plotW, width: zonePcts.r * plotW }
  };

  function getPoints(): Point[] {
    const aFrac = adsr.a / ADSR_MAX.a;
    const dFrac = adsr.d / ADSR_MAX.d;
    const rFrac = adsr.r / ADSR_MAX.r;
    const susY = (1 - adsr.s) * plotH;

    return [
      { x: pad.left, y: pad.top + plotH },
      { x: pad.left + aFrac * zones.a.width, y: pad.top },
      { x: pad.left + zones.d.start + dFrac * zones.d.width, y: pad.top + susY },
      { x: pad.left + zones.s.start + zones.s.width, y: pad.top + susY },
      { x: pad.left + zones.r.start + rFrac * zones.r.width, y: pad.top + plotH }
    ];
  }

  function draw() {
    const pts = getPoints();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0a1628';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
    ctx.fill();

    ctx.strokeStyle = '#152040';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#152040';
    ctx.setLineDash([3, 3]);
    for (const key of ['d', 's', 'r'] as const) {
      const x = pad.left + zones[key].start;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[4].x, pad.top + plotH);
    ctx.lineTo(pts[0].x, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(233, 69, 96, 0.12)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= 2; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(pts[3].x, pts[3].y);
    ctx.lineTo(pts[4].x, pts[4].y);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (const i of [1, 2, 4]) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e94560';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = '#445';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const ly = pad.top + plotH + 14;
    ctx.fillText('A', pad.left + zones.a.start + zones.a.width / 2, ly);
    ctx.fillText('D', pad.left + zones.d.start + zones.d.width / 2, ly);
    ctx.fillText('S', pad.left + zones.s.start + zones.s.width / 2, ly);
    ctx.fillText('R', pad.left + zones.r.start + zones.r.width / 2, ly);

    updateValues();
  }

  function updateValues(): void {
    const fmt = (label: string, val: string) =>
      `<span class="adsr-label">${label}</span> <span>${val}</span>`;
    valuesEl.innerHTML = [
      fmt('A', (adsr.a * 1000).toFixed(0) + 'ms'),
      fmt('D', (adsr.d * 1000).toFixed(0) + 'ms'),
      fmt('S', adsr.s.toFixed(2)),
      fmt('R', (adsr.r * 1000).toFixed(0) + 'ms')
    ].join('');
  }

  let dragging: DragHandle | null = null;

  function canvasPos(clientX: number, clientY: number): Point {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height)
    };
  }

  function hitTest(pos: Point): DragHandle | null {
    const pts = getPoints();
    for (const i of [1, 2, 4] as const) {
      const dx = pos.x - pts[i].x;
      const dy = pos.y - pts[i].y;
      if (dx * dx + dy * dy < 200) return i;
    }
    return null;
  }

  function applyDrag(pos: Point): void {
    if (dragging === 1) {
      const minX = pad.left + zones.a.start;
      const maxX = pad.left + zones.a.start + zones.a.width;
      const x = Math.max(minX, Math.min(maxX, pos.x));
      adsr.a = Math.max(0.005, ((x - minX) / zones.a.width) * ADSR_MAX.a);
    } else if (dragging === 2) {
      const minX = pad.left + zones.d.start;
      const maxX = pad.left + zones.d.start + zones.d.width;
      const x = Math.max(minX, Math.min(maxX, pos.x));
      const y = Math.max(pad.top, Math.min(pad.top + plotH, pos.y));
      adsr.d = Math.max(0.005, ((x - minX) / zones.d.width) * ADSR_MAX.d);
      adsr.s = Math.max(0, Math.min(1, 1 - (y - pad.top) / plotH));
    } else if (dragging === 4) {
      const minX = pad.left + zones.r.start;
      const maxX = pad.left + zones.r.start + zones.r.width;
      const x = Math.max(minX, Math.min(maxX, pos.x));
      adsr.r = Math.max(0.01, ((x - minX) / zones.r.width) * ADSR_MAX.r);
    }
    draw();
    if (onChange) onChange();
  }

  canvas.addEventListener('mousedown', e => {
    const pos = canvasPos(e.clientX, e.clientY);
    dragging = hitTest(pos);
    if (dragging) canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('mousemove', e => {
    const pos = canvasPos(e.clientX, e.clientY);
    if (dragging === null) {
      canvas.style.cursor = hitTest(pos) ? 'grab' : 'default';
      return;
    }
    applyDrag(pos);
  });

  window.addEventListener('mouseup', () => {
    if (dragging !== null) {
      dragging = null;
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (!t) return;
    const pos = canvasPos(t.clientX, t.clientY);
    dragging = hitTest(pos);
    if (dragging) e.preventDefault();
  });

  canvas.addEventListener('touchmove', e => {
    if (dragging === null) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    applyDrag(canvasPos(t.clientX, t.clientY));
  });

  canvas.addEventListener('touchend', () => { dragging = null; });

  draw();
  return { draw };
}
