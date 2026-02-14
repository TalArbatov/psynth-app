export class LFO {
    constructor() {
        this.waveform = 'sine';
        this.rate = 1;
        this.bpmSync = false;
        this.bpm = 120;
        this.syncDivision = '1/4';
        this.phase = 0; // degrees
        this.delay = 0; // seconds
        this.fadeIn = 0; // seconds
        this.oneShot = false;
        this.depth = 0.5; // 0-1
        this.targets = new Set();
        this._startTime = null;
        this._stopped = false;
    }
    addTarget(target) {
        this.targets.add(target);
    }
    removeTarget(target) {
        this.targets.delete(target);
    }
    hasTarget(target) {
        return this.targets.has(target);
    }
    getEffectiveRate() {
        if (this.bpmSync) {
            const beatsPerDivision = LFO.SYNC_DIVISIONS[this.syncDivision] || 1;
            return (this.bpm / 60) / beatsPerDivision;
        }
        return this.rate;
    }
    getValue(currentTime) {
        if (this._startTime === null) {
            this._startTime = currentTime;
        }
        if (this._stopped)
            return 0;
        const elapsed = currentTime - this._startTime;
        // Delay period
        if (elapsed < this.delay)
            return 0;
        const activeTime = elapsed - this.delay;
        const rate = this.getEffectiveRate();
        const phaseOffset = this.phase / 360;
        const cyclePos = (activeTime * rate + phaseOffset) % 1;
        // One-shot: stop after 1 full cycle
        if (this.oneShot && activeTime * rate >= 1) {
            this._stopped = true;
            return 0;
        }
        // Fade-in multiplier
        let fadeMultiplier = 1;
        if (this.fadeIn > 0 && activeTime < this.fadeIn) {
            fadeMultiplier = activeTime / this.fadeIn;
        }
        const raw = this._computeWaveform(cyclePos);
        return raw * this.depth * fadeMultiplier;
    }
    _computeWaveform(t) {
        // t is 0..1 position in cycle, returns -1..1
        switch (this.waveform) {
            case 'sine':
                return Math.sin(t * 2 * Math.PI);
            case 'triangle':
                if (t < 0.25)
                    return t * 4;
                if (t < 0.75)
                    return 1 - (t - 0.25) * 4;
                return -1 + (t - 0.75) * 4;
            case 'square':
                return t < 0.5 ? 1 : -1;
            case 'sawtooth':
                return 2 * t - 1;
            default:
                return Math.sin(t * 2 * Math.PI);
        }
    }
    reset() {
        this._startTime = null;
        this._stopped = false;
    }
}
// Sync division -> beats
LFO.SYNC_DIVISIONS = {
    '1/1': 4,
    '1/2': 2,
    '1/4': 1,
    '1/8': 0.5,
    '1/16': 0.25,
};
//# sourceMappingURL=lfo.js.map