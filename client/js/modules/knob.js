export function createKnob(canvas, hiddenInput, opts) {
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('2D context is required for knob rendering.');
    const { min, max, step, onChange, formatLabel } = opts;
    let value = opts.value ?? 0;
    let enabled = true;
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
    const startAngle = Math.PI * 0.75; // 135°
    const endAngle = Math.PI * 2.25; // 405° (= 45°)
    const sweep = endAngle - startAngle; // 270°
    function valueFrac() {
        return (value - min) / (max - min);
    }
    function draw() {
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
        // Dimmed overlay when disabled
        if (!enabled) {
            ctx.fillStyle = 'rgba(17,17,20,0.45)';
            ctx.fillRect(0, 0, w, h);
        }
    }
    function setValue(v) {
        value = Math.max(min, Math.min(max, v));
        // Snap to step
        value = Math.round(value / step) * step;
        draw();
    }
    function commitValue() {
        hiddenInput.value = String(value);
        hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        if (onChange)
            onChange(value);
    }
    function setEnabled(flag) {
        enabled = flag;
        canvas.style.cursor = flag ? 'grab' : 'not-allowed';
        draw();
    }
    // --- Mouse interaction ---
    let dragging = false;
    let dragStartY = 0;
    let dragStartValue = 0;
    canvas.addEventListener('mousedown', e => {
        if (!enabled)
            return;
        dragging = true;
        dragStartY = e.clientY;
        dragStartValue = value;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
        if (!dragging)
            return;
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
        if (!enabled)
            return;
        const t = e.touches[0];
        dragging = true;
        dragStartY = t.clientY;
        dragStartValue = value;
        e.preventDefault();
    });
    canvas.addEventListener('touchmove', e => {
        if (!dragging)
            return;
        e.preventDefault();
        const t = e.touches[0];
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
    return { draw, setValue, setEnabled };
}
//# sourceMappingURL=knob.js.map