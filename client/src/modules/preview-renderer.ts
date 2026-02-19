/**
 * Offline audio preview renderer.
 *
 * Preset data uses the "snapshot" format produced by capturePresetSnapshot():
 *   { masterVolume, voices: [{ enabled, waveform, volume, detune, unisonCount, unisonDetune, unisonSpread, adsr }], filter: { enabled, type, cutoff, resonance } }
 */

export interface PreviewResult {
  buffer: AudioBuffer;
  points: Float32Array;
}

/** Shape of a voice in the snapshot format */
interface SnapshotVoice {
  enabled: boolean;
  waveform: OscillatorType;
  volume: number;
  detune: number;
  unisonCount: number;
  unisonDetune: number;
  unisonSpread: number;
  adsr: { a: number; d: number; s: number; r: number };
}

/** Shape of the filter in the snapshot format */
interface SnapshotFilter {
  enabled: boolean;
  type: BiquadFilterType;
  cutoff: number;
  resonance: number;
}

const SAMPLE_RATE = 44100;
const DURATION = 1.4;          // total render length (seconds)
const NOTE_ON_TIME = 0;
const NOTE_OFF_TIME = 1.2;
const NOTE_FREQ = 110;         // A2
const BUCKET_COUNT = 512;

/**
 * Render a short audio preview of a patch using OfflineAudioContext.
 * Mirrors OscillatorVoice.scheduleNote() ADSR logic but works offline.
 */
export async function renderPresetPreview(
  data: Record<string, any>,
  signal?: AbortSignal,
): Promise<PreviewResult> {
  const ctx = new OfflineAudioContext(2, SAMPLE_RATE * DURATION, SAMPLE_RATE);

  const masterGain = ctx.createGain();
  masterGain.gain.value = data.masterVolume ?? 0.7;

  // Optional filter
  let destination: AudioNode = ctx.destination;
  const filter: SnapshotFilter | undefined = data.filter;
  if (filter?.enabled) {
    const bqf = ctx.createBiquadFilter();
    bqf.type = filter.type ?? 'lowpass';
    bqf.frequency.value = filter.cutoff ?? 2000;
    bqf.Q.value = filter.resonance ?? 1;
    bqf.connect(ctx.destination);
    destination = bqf;
  }
  masterGain.connect(destination);

  // Schedule each enabled voice
  const voices: SnapshotVoice[] = data.voices ?? [];
  for (const voice of voices) {
    if (!voice.enabled) continue;
    scheduleVoice(ctx, voice, masterGain);
  }

  const buffer = await ctx.startRendering();

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const points = extractWaveformPoints(buffer, BUCKET_COUNT);
  return { buffer, points };
}

function scheduleVoice(
  ctx: OfflineAudioContext,
  voice: SnapshotVoice,
  destination: AudioNode,
): void {
  const N = voice.unisonCount || 1;
  const { a, d, s, r } = voice.adsr;
  const scaledVolume = voice.volume / Math.sqrt(N);

  const voiceGain = ctx.createGain();
  voiceGain.gain.value = 0;
  voiceGain.connect(destination);

  const freq = NOTE_FREQ;

  for (let i = 0; i < N; i++) {
    const unisonOffset = N > 1 ? voice.unisonDetune * (2 * i / (N - 1) - 1) : 0;
    const pan = N > 1 ? voice.unisonSpread * (2 * i / (N - 1) - 1) : 0;

    const oscillator = ctx.createOscillator();
    oscillator.type = voice.waveform;
    oscillator.frequency.setValueAtTime(freq, NOTE_ON_TIME);
    oscillator.detune.setValueAtTime(voice.detune + unisonOffset, NOTE_ON_TIME);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, NOTE_ON_TIME);

    oscillator.connect(panner);
    panner.connect(voiceGain);

    oscillator.start(NOTE_ON_TIME);
    oscillator.stop(NOTE_OFF_TIME + r + 0.01);
  }

  // ADSR envelope scheduling (mirrors OscillatorVoice.scheduleNote)
  const g = voiceGain.gain;
  const startTime = NOTE_ON_TIME;
  const offTime = NOTE_OFF_TIME;
  const attackEnd = startTime + a;
  const decayEnd = startTime + a + d;
  const endTime = offTime + r;

  g.setValueAtTime(0, startTime);

  if (offTime > decayEnd) {
    g.linearRampToValueAtTime(scaledVolume, attackEnd);
    g.linearRampToValueAtTime(scaledVolume * s, decayEnd);
    g.setValueAtTime(scaledVolume * s, offTime);
  } else if (offTime > attackEnd) {
    g.linearRampToValueAtTime(scaledVolume, attackEnd);
    g.linearRampToValueAtTime(scaledVolume * s, offTime);
  } else {
    const level = a > 0 ? scaledVolume * ((offTime - startTime) / a) : scaledVolume;
    g.linearRampToValueAtTime(level, offTime);
  }

  g.linearRampToValueAtTime(0, endTime);
}

/**
 * Divide channel 0 into `bucketCount` buckets, take peak absolute value per
 * bucket, normalize by global max.
 */
export function extractWaveformPoints(
  buffer: AudioBuffer,
  bucketCount: number,
): Float32Array {
  const raw = buffer.getChannelData(0);
  const samplesPerBucket = Math.floor(raw.length / bucketCount);
  const points = new Float32Array(bucketCount);
  let globalMax = 0;

  for (let b = 0; b < bucketCount; b++) {
    let peak = 0;
    const start = b * samplesPerBucket;
    const end = start + samplesPerBucket;
    for (let i = start; i < end; i++) {
      const abs = Math.abs(raw[i]);
      if (abs > peak) peak = abs;
    }
    points[b] = peak;
    if (peak > globalMax) globalMax = peak;
  }

  // Normalize
  if (globalMax > 0) {
    for (let b = 0; b < bucketCount; b++) {
      points[b] /= globalMax;
    }
  }

  return points;
}
