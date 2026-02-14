"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFXChain = createFXChain;
const saturation_js_1 = require("./saturation.js");
const eq_js_1 = require("./eq.js");
const chorus_js_1 = require("./chorus.js");
const delay_js_1 = require("./delay.js");
const reverb_js_1 = require("./reverb.js");
const compressor_js_1 = require("./compressor.js");
function createFXChain(audioCtx) {
    const saturation = (0, saturation_js_1.createSaturation)(audioCtx);
    const eq = (0, eq_js_1.createEQ)(audioCtx);
    const chorus = (0, chorus_js_1.createChorus)(audioCtx);
    const delay = (0, delay_js_1.createDelay)(audioCtx);
    const reverb = (0, reverb_js_1.createReverb)(audioCtx);
    const compressor = (0, compressor_js_1.createCompressor)(audioCtx);
    // Chain: saturation → eq → chorus → delay → reverb → compressor
    saturation.output.connect(eq.input);
    eq.output.connect(chorus.input);
    chorus.output.connect(delay.input);
    delay.output.connect(reverb.input);
    reverb.output.connect(compressor.input);
    return {
        input: saturation.input,
        output: compressor.output,
        saturation,
        eq,
        chorus,
        delay,
        reverb,
        compressor
    };
}
