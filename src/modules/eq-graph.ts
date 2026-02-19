import type { EQUnit } from './types.js';

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const DB_MIN = -24;
const DB_MAX = 24;
const NUM_POINTS = 256;

export function createEQGraph(canvas: HTMLCanvasElement, eq: EQUnit) {
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('2D context is required for EQ graph.');
  }
  const ctx: CanvasRenderingContext2D = tempCtx;

  const pad = { top: 12, bottom: 18, left: 30, right: 8 };
  const plotW = canvas.width - pad.left - pad.right;
  const plotH = canvas.height - pad.top - pad.bottom;

  const freqArray = new Float32Array(NUM_POINTS);
  const hpMag = new Float32Array(NUM_POINTS);
  const bandMag = new Float32Array(NUM_POINTS);
  const shelfMag = new Float32Array(NUM_POINTS);
  const phaseScratch = new Float32Array(NUM_POINTS);

  for (let i = 0; i < NUM_POINTS; i++) {
    freqArray[i] = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / (NUM_POINTS - 1));
  }

  function freqToX(freq: number): number {
    const t = Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ);
    return pad.left + t * plotW;
  }

  function dbToY(db: number): number {
    const clamped = Math.max(DB_MIN, Math.min(DB_MAX, db));
    return pad.top + (1 - (clamped - DB_MIN) / (DB_MAX - DB_MIN)) * plotH;
  }

  function drawGrid(): void {
    ctx.strokeStyle = '#152040';
    ctx.lineWidth = 1;

    for (const db of [-18, -12, -6, 0, 6, 12, 18]) {
      const y = dbToY(db);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#334';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${db}`, pad.left - 4, y + 3);
    }

    ctx.setLineDash([3, 3]);
    for (const freq of [100, 1000, 10000]) {
      const x = freqToX(freq);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = '#445';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('100', freqToX(100), pad.top + plotH + 14);
    ctx.fillText('1k', freqToX(1000), pad.top + plotH + 14);
    ctx.fillText('10k', freqToX(10000), pad.top + plotH + 14);
  }

  function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a1628';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
    ctx.fill();

    drawGrid();

    eq.hp.getFrequencyResponse(freqArray, hpMag, phaseScratch);
    eq.band.getFrequencyResponse(freqArray, bandMag, phaseScratch);
    eq.shelf.getFrequencyResponse(freqArray, shelfMag, phaseScratch);

    ctx.beginPath();
    for (let i = 0; i < NUM_POINTS; i++) {
      const x = freqToX(freqArray[i]);
      const mag = (hpMag[i] || 0.001) * (bandMag[i] || 0.001) * (shelfMag[i] || 0.001);
      const db = 20 * Math.log10(Math.max(0.001, mag));
      const y = dbToY(db);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  return { draw };
}

