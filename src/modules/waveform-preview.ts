type PreviewWaveform = OscillatorType;

export function createWaveformPreview(canvas: HTMLCanvasElement) {
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('2D context is required for waveform preview.');
  }
  const ctx: CanvasRenderingContext2D = tempCtx;
  const w = canvas.width;
  const h = canvas.height;
  let currentType: PreviewWaveform = 'sine';

  function draw(): void {
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0a1628';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 4);
    ctx.fill();

    // Waveform line
    const pad = 4;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;
    const midY = pad + plotH / 2;

    ctx.beginPath();
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 1.5;

    for (let i = 0; i <= plotW; i++) {
      const t = i / plotW; // 0..1 = one cycle
      let y;

      switch (currentType) {
        case 'sine':
          y = Math.sin(t * Math.PI * 2);
          break;
        case 'triangle':
          y = t < 0.25 ? t * 4
            : t < 0.75 ? 2 - t * 4
            : t * 4 - 4;
          break;
        case 'sawtooth':
          y = t < 0.5 ? t * 2 : t * 2 - 2;
          break;
        case 'square':
          y = t < 0.5 ? 1 : -1;
          break;
        default:
          y = 0;
      }

      const px = pad + i;
      const py = midY - y * (plotH / 2) * 0.85;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function setWaveform(type: PreviewWaveform): void {
    currentType = type;
    draw();
  }

  draw();
  return { setWaveform, draw };
}
