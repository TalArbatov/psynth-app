# psynth-web

A browser-based polyphonic synthesizer built with the Web Audio API. Features dual oscillators with unison, a modulation matrix, an FX chain, a step sequencer, and real-time multi-user sync over WebSocket.

![Stack](https://img.shields.io/badge/React_19-TypeScript-blue) ![Build](https://img.shields.io/badge/Vite_7-ESM-green)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- The following backend services (not included in this repo):
  - **Auth service** on port `3050` — handles login, registration, logout, and session cookies
  - **Project service** on port `3051` — preset CRUD and publishing API
  - **Sync backend** on port `4000` — WebSocket server for real-time session sync

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server (default `http://localhost:5173`). Backend URLs are configured in `.env.development`:

```
VITE_API_BASE_URL_DEV=http://localhost:4000
VITE_API_AUTH_SERVICE_URL=http://localhost:3050
VITE_API_PROJECT_SERVICE_URL=http://localhost:3051
```

### Build

```bash
npm run build
```

Runs TypeScript type checking (`tsc`) followed by `vite build`. Output goes to `dist/`.

### Deploy

```bash
npm run deploy
```

Builds and copies `dist/` to the production server via SCP.

---

## Technical Specification

### Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode, ES2020 target) |
| UI Framework | React 19 with react-router-dom v7 |
| Build Tool | Vite 7 with `@vitejs/plugin-react` |
| Audio | Web Audio API (native browser API) |
| Real-time Sync | WebSocket (native browser API) |
| Styling | Single global CSS file (`synth.css`) |

No test framework, linter, or CSS preprocessor is configured.

### Architecture Overview

The application uses a **hybrid rendering model** combining React declarative components with imperative canvas and Web Audio code.

```
                     React Tree                          Imperative Layer
                  ┌──────────────┐                    ┌──────────────────┐
 App.tsx          │ BrowserRouter │                    │  bootstrapSynth()│
 (routes,        │  AuthProvider  │                    │                  │
  contexts)       │  SessionProv.  │    runtime ref     │  SynthRuntime    │
                  │   SynthPage ──│───────────────────▶│  SynthViews      │
                  │    SynthLayout │                    │  wireSynth()     │
                  │     OscPage    │                    │                  │
                  │     FxPage     │                    │  Animation Loop  │
                  │     SeqPage    │                    │  (rAF)           │
                  └──────────────┘                    └──────────────────┘
```

**React layer** (`src/components/`) owns the UI shell: routing, auth flow, preset browser, knob controls, tab navigation, and the mod matrix. State is managed through React contexts and hooks.

**Imperative layer** (`src/modules/`) directly manipulates `<canvas>` elements and Web Audio nodes. It runs a continuous `requestAnimationFrame` loop that computes LFO modulation values and redraws visual components (waveform display, piano keyboard, ADSR graphs, filter/EQ curves). This layer is not managed by React's render cycle.

The two layers communicate through the `SynthRuntime` object, which is created once and passed as a prop into the React tree.

### Bootstrap Sequence

When a user navigates to `/synth`, `bootstrapSynth()` executes once (guarded by `window.__synthAppStarted`):

1. **`createSynthRuntime()`** — instantiates the `AudioEngine` (2 oscillator voices), the FX chain, 8 LFO instances (4 per oscillator), and a WebSocket sync client
2. **`createSynthViews()`** — creates canvas-based interactive views: ADSR envelope graphs, piano keyboard, waveform oscilloscope, and EQ visualizer
3. **`wireSynth()`** — connects the animation loop, lazily loads the filter graph, initializes sync outbound/inbound handlers

### Audio Engine

#### Signal Flow

```
OscillatorVoice[0] ──┐
                      ├──▶ masterGain ──▶ BiquadFilter ──▶ FX Chain ──▶ AnalyserNode ──▶ destination
OscillatorVoice[1] ──┘                    (global)
```

#### Oscillator Voices

Each `OscillatorVoice` supports:
- **Waveforms**: sine, triangle, square, sawtooth
- **Unison**: configurable voice count with per-voice detuning and stereo spread
- **ADSR envelope**: per-voice attack, decay, sustain, release applied via `GainNode` automation
- **Note scheduling**: pre-scheduled notes on the Web Audio timeline for sequencer playback (drift-free)

Per-voice signal path: `N OscillatorNodes` → individual `StereoPannerNodes` → shared `GainNode` (ADSR) → voice destination

#### FX Chain

Six serial effects, each independently bypassable:

```
Saturation → EQ (3-band) → Chorus → Delay → Reverb → Compressor
```

Each effect implements the `EffectUnit<TParams>` interface with `input`/`output` GainNodes, `setEnabled()`, and `set()`.

| Effect | Key Parameters |
|---|---|
| Saturation | type (soft/hard/wave), drive, output, tone, mix |
| EQ | HP frequency, band freq/gain/Q, shelf freq/gain |
| Chorus | rate, depth, delay, spread, mix |
| Delay | time, feedback, mix, ping-pong mode, filter frequency |
| Reverb | size, pre-delay, damping, mix |
| Compressor | threshold, ratio, attack, release, makeup gain |

### Modulation System

#### LFOs

4 global LFOs, each with:
- Waveforms: sine, triangle, square, sawtooth
- Rate (free-running Hz or BPM-synced with division: 1/1, 1/2, 1/4, 1/8, 1/16)
- Depth, phase offset, delay, fade-in time
- One-shot mode (single cycle then stop)

LFO values are computed in the `requestAnimationFrame` loop (`animation-loop.ts`) and applied to targets each frame.

#### Mod Matrix

Routes any `ModSource` (lfo1–4, env1–2) to any `ModDestination`:
- Oscillator: level, detune, unison detune, unison spread (per-osc)
- Global: filter cutoff, master volume
- FX: saturation drive/mix, chorus rate/depth/mix, delay time/feedback/mix, reverb size/mix, compressor threshold/ratio

Each routing has a bipolar amount (-1 to +1). Drag-and-drop wiring is handled in `src/modules/drag-drop.ts`.

### Step Sequencer

Uses the **Web Audio lookahead scheduling pattern** for drift-free playback:
- A JS `setInterval` timer fires every 25ms
- It pre-schedules notes within a 100ms lookahead window directly on the Web Audio timeline
- Supports 8, 16, or 32 steps with per-step note, velocity, and gate length
- Swing applies timing offset to odd-numbered steps
- Catches up gracefully if the main thread stalls (skips ahead instead of bursting)

### Patch Model

The `Patch` interface (`src/models/patch.ts`) is the canonical state schema:

```typescript
interface Patch {
  name: string;
  version: 1;
  global: { masterVolume, voiceMode, glide, bpm, filter params };
  oscillators: [OscPatch, OscPatch];        // 2 oscillators
  lfos: [LfoPatch, LfoPatch, LfoPatch, LfoPatch];  // 4 LFOs
  envelopes: [EnvPatch, EnvPatch];          // 2 envelopes
  modMatrix: ModRouting[];                   // arbitrary mod routings
  fx: FxPatch;                              // all 6 FX units
}
```

**PatchContext** wraps this in a `useReducer` with undo/redo (50-level stack). It bridges every patch change to the audio engine in a `useEffect` and persists to `localStorage` (key: `synth-patch-v1`) with 500ms debounce.

### Preset System

Three categories: **Factory** (read-only), **Saved** (user-owned), **Public** (community-shared).

`usePresetStore` hook manages:
- CRUD operations via REST API (project service at `/api/presets/{factory|saved|public}`)
- Navigation (prev/next within a category)
- Dirty detection (1-second polling compares current snapshot to clean state)
- Optimistic UI for likes, favorites, and list mutations
- In-memory cache with TTL (60s for lists, 5min for full presets) and request deduplication
- localStorage persistence of last-loaded preset ref and data

Server responses use `snake_case` (`data_json`, `created_at`, `likes_count`); the API layer normalizes to `camelCase`.

### Real-time Sync

WebSocket-based session sync (`src/modules/sync.ts`):

- Converts the backend HTTP URL to `ws://` / `wss://` automatically
- Messages are typed union (`SyncMessage`): note on/off, control changes, ADSR updates, filter changes, sequencer state
- Guards against echo loops: messages received from the server are not re-sent
- Outbound sync for control inputs, ADSR drag, filter drag, sequencer state
- Inbound sync applies changes to the audio engine and updates canvas views

### Keyboard Input

The piano keyboard supports both mouse/touch interaction on the canvas and computer keyboard input:

| Keys | Action |
|---|---|
| `A S D F G H J K` | White keys (C4–C5) |
| `W E T Y U` | Black keys (C#4–A#4) |
| `Z` / `X` | Octave down / up (range: C1–B8) |

### UI Controls

**Knob controls** are canvas-rendered rotary knobs with 270-degree sweep. Interaction is vertical drag (mouse or touch) with 150px = full range. Knobs support:
- Mod rings: colored arcs showing modulation amount from the mod matrix
- Enable/disable state with dimmed overlay
- Optional center labels with custom formatting

### Project Structure

```
src/
├── application/synth/   Bootstrap, runtime, views, wiring (composition root)
├── api/                 HTTP clients for auth and preset services
├── components/          React components (pages, synth UI panels)
├── config/              API URL configuration from Vite env vars
├── context/             React contexts (Auth, Session, Patch)
├── hooks/               Custom hooks (usePresetStore, usePresetPreview)
├── models/              TypeScript interfaces (Patch, mod types)
└── modules/             Imperative audio/canvas code
    ├── fx/              FX unit implementations
    ├── audio-engine.ts  AudioContext + voice management
    ├── oscillator-voice.ts  Per-voice oscillator with ADSR + unison
    ├── lfo.ts           LFO with BPM sync + one-shot
    ├── step-sequencer.ts  Lookahead-scheduled sequencer
    ├── piano-keyboard.ts  Canvas keyboard with mouse/touch/keydown
    ├── knob.ts          Canvas rotary knob control
    ├── animation-loop.ts  rAF loop for modulation + drawing
    └── ...              Graphs, drag-drop, sync handlers, etc.
```
