"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReverb = createReverb;
function createReverb(audioCtx) {
    const input = audioCtx.createGain();
    const output = audioCtx.createGain();
    const dryGain = audioCtx.createGain();
    const wetGain = audioCtx.createGain();
    const preDelay = audioCtx.createDelay(0.1);
    preDelay.delayTime.value = 0.01;
    const convolver = audioCtx.createConvolver();
    const damping = audioCtx.createBiquadFilter();
    damping.type = 'lowpass';
    damping.frequency.value = 8000;
    // Generate impulse response
    let currentSize = 2;
    generateIR(currentSize);
    function generateIR(duration) {
        const sampleRate = audioCtx.sampleRate;
        const length = Math.max(sampleRate * duration, sampleRate * 0.1);
        const buffer = audioCtx.createBuffer(2, length, sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        convolver.buffer = buffer;
    }
    // Dry path
    input.connect(dryGain).connect(output);
    // Wet path
    input.connect(preDelay).connect(convolver).connect(damping).connect(wetGain).connect(output);
    // Start bypassed
    dryGain.gain.value = 1;
    wetGain.gain.value = 0;
    return {
        input,
        output,
        setEnabled(on) {
            dryGain.gain.setValueAtTime(on ? 0.5 : 1, audioCtx.currentTime);
            wetGain.gain.setValueAtTime(on ? 0.5 : 0, audioCtx.currentTime);
        },
        set(params) {
            if (params.size !== undefined && params.size !== currentSize) {
                currentSize = params.size;
                generateIR(currentSize);
            }
            if (params.preDelay !== undefined) {
                preDelay.delayTime.setValueAtTime(params.preDelay / 1000, audioCtx.currentTime);
            }
            if (params.damping !== undefined) {
                damping.frequency.setValueAtTime(params.damping, audioCtx.currentTime);
            }
            if (params.mix !== undefined) {
                dryGain.gain.setValueAtTime(1 - params.mix * 0.5, audioCtx.currentTime);
                wetGain.gain.setValueAtTime(params.mix * 0.5, audioCtx.currentTime);
            }
        }
    };
}
