"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDelay = createDelay;
function createDelay(audioCtx) {
    const input = audioCtx.createGain();
    const output = audioCtx.createGain();
    const dryGain = audioCtx.createGain();
    const wetGain = audioCtx.createGain();
    // Delay nodes
    const delayL = audioCtx.createDelay(2);
    const delayR = audioCtx.createDelay(2);
    delayL.delayTime.value = 0.3;
    delayR.delayTime.value = 0.3;
    // Feedback
    const feedbackL = audioCtx.createGain();
    const feedbackR = audioCtx.createGain();
    feedbackL.gain.value = 0.3;
    feedbackR.gain.value = 0.3;
    // Feedback filter
    const feedbackFilter = audioCtx.createBiquadFilter();
    feedbackFilter.type = 'lowpass';
    feedbackFilter.frequency.value = 5000;
    // Splitter/merger for ping-pong
    const splitter = audioCtx.createChannelSplitter(2);
    const merger = audioCtx.createChannelMerger(2);
    let pingPong = false;
    // Normal (mono) delay routing
    function wireNormal() {
        // Disconnect everything
        try {
            input.disconnect(delayL);
            input.disconnect(delayR);
            delayL.disconnect();
            delayR.disconnect();
            feedbackL.disconnect();
            feedbackR.disconnect();
            feedbackFilter.disconnect();
            merger.disconnect();
        }
        catch (e) { /* ignore */ }
        // input → delayL → feedbackFilter → feedbackL → delayL (loop)
        // delayL → wetGain → output
        input.connect(delayL);
        delayL.connect(feedbackFilter);
        feedbackFilter.connect(feedbackL);
        feedbackL.connect(delayL);
        delayL.connect(wetGain);
    }
    // Ping-pong routing
    function wirePingPong() {
        try {
            input.disconnect(delayL);
            input.disconnect(delayR);
            delayL.disconnect();
            delayR.disconnect();
            feedbackL.disconnect();
            feedbackR.disconnect();
            feedbackFilter.disconnect();
            merger.disconnect();
        }
        catch (e) { /* ignore */ }
        // input → delayL → feedbackFilter → feedbackR → delayR → feedbackL → delayL (cross-feedback)
        input.connect(delayL);
        delayL.connect(feedbackFilter);
        feedbackFilter.connect(feedbackR);
        feedbackR.connect(delayR);
        delayR.connect(feedbackL);
        feedbackL.connect(delayL);
        // Merge L/R to stereo
        delayL.connect(merger, 0, 0);
        delayR.connect(merger, 0, 1);
        merger.connect(wetGain);
    }
    // Dry path
    input.connect(dryGain).connect(output);
    wetGain.connect(output);
    // Start bypassed
    dryGain.gain.value = 1;
    wetGain.gain.value = 0;
    // Default wiring
    wireNormal();
    return {
        input,
        output,
        setEnabled(on) {
            dryGain.gain.setValueAtTime(on ? 1 : 1, audioCtx.currentTime);
            wetGain.gain.setValueAtTime(on ? 0.5 : 0, audioCtx.currentTime);
        },
        set(params) {
            if (params.time !== undefined) {
                const t = params.time / 1000; // ms to seconds
                delayL.delayTime.setValueAtTime(t, audioCtx.currentTime);
                delayR.delayTime.setValueAtTime(pingPong ? t : t, audioCtx.currentTime);
            }
            if (params.feedback !== undefined) {
                feedbackL.gain.setValueAtTime(params.feedback, audioCtx.currentTime);
                feedbackR.gain.setValueAtTime(params.feedback, audioCtx.currentTime);
            }
            if (params.mix !== undefined) {
                wetGain.gain.setValueAtTime(params.mix * 0.7, audioCtx.currentTime);
            }
            if (params.pingPong !== undefined && params.pingPong !== pingPong) {
                pingPong = params.pingPong;
                if (pingPong)
                    wirePingPong();
                else
                    wireNormal();
            }
            if (params.filterFreq !== undefined) {
                feedbackFilter.frequency.setValueAtTime(params.filterFreq, audioCtx.currentTime);
            }
        }
    };
}
