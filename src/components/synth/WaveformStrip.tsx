import { useEffect, useRef } from 'react';
import type { PreviewStatus } from '../../hooks/usePresetPreview.js';

type Props = {
  points: Float32Array | null;
  status: PreviewStatus;
  error: string | null;
  height?: number;
  onPlay?: () => void;
};

export function WaveformStrip({ points, status, error, height = 48, onPlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !points || status !== 'ready') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, w, h);

    // Waveform (mirrored above/below center)
    ctx.fillStyle = '#00d2ff';
    const barW = w / points.length;

    for (let i = 0; i < points.length; i++) {
      const amp = points[i] * (midY - 1);
      const x = i * barW;
      ctx.fillRect(x, midY - amp, barW, amp * 2);
    }
  }, [points, status, height]);

  if (status === 'idle') return null;

  if (status === 'loading') {
    return <div className="waveform-strip-skeleton" style={{ height }} />;
  }

  if (status === 'error') {
    return (
      <div className="waveform-strip-error" style={{ height }}>
        {error ?? 'Preview error'}
      </div>
    );
  }

  return (
    <div className="waveform-strip" style={{ height }}>
      <canvas
        ref={canvasRef}
        width={512}
        height={height}
        style={{ width: '100%', height: '100%' }}
      />
      {onPlay && (
        <button className="waveform-strip-play" onClick={onPlay} aria-label="Play preview">
          &#9654;
        </button>
      )}
    </div>
  );
}
