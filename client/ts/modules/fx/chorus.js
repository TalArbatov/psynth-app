"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChorus = createChorus;
function createChorus(audioCtx) {
    const input = audioCtx.createGain();
    const output = audioCtx.createGain();
    const dryGain = audioCtx.createGain();
    const wetGain = audioCtx.createGain();
    const splitter = audioCtx.createChannelSplitter(2);
    const merger = audioCtx.createChannelMerger(2);
    // Two modulated delay lines for stereo
    const delayL = audioCtx.createDelay(0.1);
    const delayR = audioCtx.createDelay(0.1);
    delayL.delayTime.value = 0.01;
    delayR.delayTime.value = 0.01;
    // LFOs for modulation
    const lfoL = audioCtx.createOscillator();
    const lfoR = audioCtx.createOscillator();
    const lfoGainL = audioCtx.createGain();
    const lfoGainR = audioCtx.createGain();
    lfoL.type = 'sine';
    lfoR.type = 'sine';
    lfoL.frequency.value = 0.8;
    lfoR.frequency.value = 0.8;
    lfoGainL.gain.value = 0.002; // depth in seconds
    lfoGainR.gain.value = 0.002;
    // LFO modulates delay time
    lfoL.connect(lfoGainL).connect(delayL.delayTime);
    lfoR.connect(lfoGainR).connect(delayR.delayTime);
    // Offset the right LFO phase by starting slightly later
    lfoR.detune.value = 10; // slight detuning for stereo spread
    lfoL.start();
    lfoR.start();
    // Stereo panners
    const panL = audioCtx.createStereoPanner();
    const panR = audioCtx.createStereoPanner();
    panL.pan.value = -0.5;
    panR.pan.value = 0.5;
    // Wet path: input → delays → panners → merger → wetGain → output
    input.connect(delayL);
    input.connect(delayR);
    delayL.connect(panL).connect(merger, 0, 0);
    delayR.connect(panR).connect(merger, 0, 1);
    merger.connect(wetGain).connect(output);
    // Dry path
    input.connect(dryGain).connect(output);
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
            if (params.rate !== undefined) {
                lfoL.frequency.setValueAtTime(params.rate, audioCtx.currentTime);
                lfoR.frequency.setValueAtTime(params.rate, audioCtx.currentTime);
            }
            if (params.depth !== undefined) {
                const depthSec = params.depth / 1000; // ms to seconds
                lfoGainL.gain.setValueAtTime(depthSec, audioCtx.currentTime);
                lfoGainR.gain.setValueAtTime(depthSec, audioCtx.currentTime);
            }
            if (params.delay !== undefined) {
                const delaySec = params.delay / 1000;
                delayL.delayTime.setValueAtTime(delaySec, audioCtx.currentTime);
                delayR.delayTime.setValueAtTime(delaySec, audioCtx.currentTime);
            }
            if (params.spread !== undefined) {
                const s = params.spread / 100;
                panL.pan.setValueAtTime(-s, audioCtx.currentTime);
                panR.pan.setValueAtTime(s, audioCtx.currentTime);
            }
            if (params.mix !== undefined) {
                dryGain.gain.setValueAtTime(1 - params.mix * 0.5, audioCtx.currentTime);
                wetGain.gain.setValueAtTime(params.mix * 0.5, audioCtx.currentTime);
            }
        }
    };
}
