import type { Drawable } from './types.js';
import { activeTheme } from './theme.js';

export function createWaveformDisplay(canvas: HTMLCanvasElement, analyser: AnalyserNode): Drawable {
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('2D context is required for waveform display.');
  }
  const ctx: CanvasRenderingContext2D = tempCtx;
  const bufLen = analyser.frequencyBinCount;
  const dataArr = new Uint8Array(bufLen);

  function draw(): void {
    analyser.getByteTimeDomainData(dataArr);

    ctx.fillStyle = activeTheme.bgWaveform;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = activeTheme.signal;
    ctx.beginPath();

    const sliceW = canvas.width / bufLen;
    let x = 0;
    for (let i = 0; i < bufLen; i++) {
      const v = dataArr[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  return { draw };
}
