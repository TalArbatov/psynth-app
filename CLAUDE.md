# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite dev server)
- **Build:** `npm run build` (runs `tsc` then `vite build`, outputs to `dist/`)
- **Type check only:** `npx tsc -p tsconfig.json --noEmit`
- **Deploy:** `npm run deploy` (builds then SCPs `dist/` to production server)

There are no tests or linting configured in this project.

## Architecture

psynth-web is a browser-based polyphonic synthesizer built with React 19 + TypeScript + Vite. It uses the Web Audio API for real-time audio synthesis and WebSocket for multi-user session sync.

### Dual rendering model

The app uses a hybrid of React components and imperative canvas/Web Audio code:

- **React layer** (`src/components/`) — handles routing, auth, preset management, and synth UI shell (knobs, tabs, panels). Uses React context for state.
- **Imperative layer** (`src/modules/`) — directly manipulates `<canvas>` elements and Web Audio nodes. Runs its own `requestAnimationFrame` loop (`animation-loop.ts`). Not managed by React's render cycle.

### Bootstrap flow

`App.tsx` renders the React tree. When the user reaches `/synth`, `bootstrapSynth()` is called exactly once (guarded by `window.__synthAppStarted`). This function:

1. **`createSynthRuntime()`** (`src/application/synth/runtime.ts`) — creates AudioEngine, FX chain, LFOs, WebSocket sync client
2. **`createSynthViews()`** (`src/application/synth/views.ts`) — creates canvas-based ADSR graphs, piano keyboard, waveform display, EQ graph
3. **`wireSynth()`** (`src/application/synth/wire.ts`) — connects the animation loop, sync handlers, and filter graph

The `SynthRuntime` object is passed down through React components as a prop, not via context.

### State management

- **PatchContext** (`src/context/PatchContext.tsx`) — `useReducer`-based state for the full synth patch (oscillators, LFOs, envelopes, FX, mod matrix). Includes undo/redo. Bridges patch changes to the audio engine in a `useEffect`. Persists to localStorage under `synth-patch-v1`.
- **usePresetStore** (`src/hooks/usePresetStore.ts`) — manages preset CRUD (factory/saved/public tabs), navigation (prev/next), dirty detection via polling, and localStorage persistence of last-loaded preset.
- **AuthContext** (`src/context/AuthContext.tsx`) — cookie-based auth state. Calls external auth service.
- **SessionContext** (`src/context/SessionContext.tsx`) — tracks the current collaborative session.

### Audio signal chain

`AudioEngine` → per-voice `OscillatorVoice` nodes → `masterGain` → global `BiquadFilterNode` → FX chain (saturation → EQ → chorus → delay → reverb → compressor) → `AnalyserNode` → `destination`

FX chain is in `src/modules/fx/`. Each effect is a self-contained class with `setEnabled()` and `set()` methods.

### Patch model

The `Patch` interface (`src/models/patch.ts`) is the canonical schema: 2 oscillators, 4 LFOs, 2 envelopes, mod matrix, FX, and global params. `DEFAULT_PATCH` provides the init state. Preset data stored on the server uses `data_json` (snake_case), normalized to camelCase by `presetApi.ts`.

### External services

Configured via Vite env vars in `.env.development` / `.env.production`:
- **Auth service** (`VITE_API_AUTH_SERVICE_URL`, default `:3050`) — login, register, logout, session cookies
- **Project service** (`VITE_API_PROJECT_SERVICE_URL`, default `:3051`) — preset CRUD at `/api/presets/{factory|saved|public}`
- **Sync backend** (`VITE_API_BASE_URL_DEV`) — WebSocket for real-time note/param sync between users

### Key conventions

- Internal module imports use `.js` extensions (TypeScript with `moduleResolution: bundler`)
- All styles are in a single `synth.css` file at the project root (no CSS modules or CSS-in-JS)
- Canvas elements are looked up by ID via `byId()`/`byCanvasId()` helpers in `src/application/synth/dom.ts`
- The mod matrix supports LFO and envelope sources routed to any `ModDestination`; drag-and-drop wiring is in `src/modules/drag-drop.ts`
