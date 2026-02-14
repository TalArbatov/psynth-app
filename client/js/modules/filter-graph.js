const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_Q = 0.1;
const MAX_Q = 20;
const DB_MIN = -30;
const DB_MAX = 20;
const NUM_POINTS = 200;

export function createFilterGraph(canvas, valuesEl, voice, onChange) {
  const ctx = canvas.getContext('2d');
  const pad = { top: 14, bottom: 20, left: 30, right: 8 };
  const plotW = canvas.width - pad.left - pad.right;
  const plotH = canvas.height - pad.top - pad.bottom;

  // Pre-allocate typed arrays for getFrequencyResponse
  const freqArray = new Float32Array(NUM_POINTS);
  const magArray = new Float32Array(NUM_POINTS);
  const phaseArray = new Float32Array(NUM_POINTS);

  for (let i = 0; i < NUM_POINTS; i++) {
    freqArray[i] = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / (NUM_POINTS - 1));
  }

  function freqToX(freq) {
    return pad.left + (Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ)) * plotW;
  }

  function xToFreq(x) {
    const t = (x - pad.left) / plotW;
    return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, Math.max(0, Math.min(1, t)));
  }

  function dbToY(db) {
    return pad.top + (1 - (db - DB_MIN) / (DB_MAX - DB_MIN)) * plotH;
  }

  function yToQ(y) {
    const t = 1 - (y - pad.top) / plotH;
    return MIN_Q + t * (MAX_Q - MIN_Q);
  }

  function getHandlePos() {
    const x = freqToX(voice.cutoff);
    // Find magnitude at cutoff frequency
    const singleFreq = new Float32Array([voice.cutoff]);
    const singleMag = new Float32Array(1);
    const singlePhase = new Float32Array(1);
    voice.filter.getFrequencyResponse(singleFreq, singleMag, singlePhase);
    const db = 20 * Math.log10(singleMag[0] || 0.001);
    const y = dbToY(Math.max(DB_MIN, Math.min(DB_MAX, db)));
    return { x, y };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0a1628';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
    ctx.fill();

    // Horizontal dB grid lines
    ctx.strokeStyle = '#152040';
    ctx.lineWidth = 1;
    const dbSteps = [-20, -10, 0, 10];
    for (const db of dbSteps) {
      const y = dbToY(db);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      // dB labels
      ctx.fillStyle = '#334';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${db}`, pad.left - 4, y + 3);
    }

    // Vertical frequency grid lines
    ctx.strokeStyle = '#152040';
    ctx.setLineDash([3, 3]);
    const freqMarkers = [100, 1000, 10000];
    const freqLabels = ['100', '1k', '10k'];
    for (let i = 0; i < freqMarkers.length; i++) {
      const x = freqToX(freqMarkers[i]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();

      ctx.fillStyle = '#445';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(freqLabels[i], x, pad.top + plotH + 14);
    }
    ctx.setLineDash([]);

    // Get frequency response
    voice.filter.getFrequencyResponse(freqArray, magArray, phaseArray);

    // Draw filled area under curve
    ctx.beginPath();
    let firstY = null;
    for (let i = 0; i < NUM_POINTS; i++) {
      const x = freqToX(freqArray[i]);
      const db = 20 * Math.log10(magArray[i] || 0.001);
      const y = dbToY(Math.max(DB_MIN, Math.min(DB_MAX, db)));
      if (i === 0) {
        ctx.moveTo(x, y);
        firstY = y;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(233, 69, 96, 0.12)';
    ctx.fill();

    // Draw curve line
    ctx.beginPath();
    for (let i = 0; i < NUM_POINTS; i++) {
      const x = freqToX(freqArray[i]);
      const db = 20 * Math.log10(magArray[i] || 0.001);
      const y = dbToY(Math.max(DB_MIN, Math.min(DB_MAX, db)));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw handle at cutoff frequency
    const handle = getHandlePos();
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    updateValues();
  }

  function updateValues() {
    const freq = voice.cutoff;
    const freqStr = freq >= 1000
      ? (freq / 1000).toFixed(1) + ' kHz'
      : freq.toFixed(0) + ' Hz';
    valuesEl.innerHTML =
      `<span class="filter-label">Cutoff</span> <span>${freqStr}</span>` +
      `<span class="filter-label">Q</span> <span>${voice.resonance.toFixed(2)}</span>`;
  }

  // --- Drag interaction ---
  let dragging = false;

  function canvasPos(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height)
    };
  }

  function hitTest(pos) {
    const handle = getHandlePos();
    const dx = pos.x - handle.x;
    const dy = pos.y - handle.y;
    return dx * dx + dy * dy < 200;
  }

  function applyDrag(pos) {
    const freq = xToFreq(pos.x);
    const clampedFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq));
    voice.setFilterCutoff(clampedFreq);

    const q = yToQ(pos.y);
    const clampedQ = Math.max(MIN_Q, Math.min(MAX_Q, q));
    voice.setFilterResonance(clampedQ);

    draw();
    if (onChange) onChange();
  }

  canvas.addEventListener('mousedown', e => {
    const pos = canvasPos(e.clientX, e.clientY);
    if (hitTest(pos)) {
      dragging = true;
      canvas.style.cursor = 'grabbing';
    }
  });

  canvas.addEventListener('mousemove', e => {
    const pos = canvasPos(e.clientX, e.clientY);
    if (!dragging) {
      canvas.style.cursor = hitTest(pos) ? 'grab' : 'default';
      return;
    }
    applyDrag(pos);
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const pos = canvasPos(t.clientX, t.clientY);
    if (hitTest(pos)) {
      dragging = true;
      e.preventDefault();
    }
  });

  canvas.addEventListener('touchmove', e => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    applyDrag(canvasPos(t.clientX, t.clientY));
  });

  canvas.addEventListener('touchend', () => { dragging = false; });

  draw();
  return { draw };
}
