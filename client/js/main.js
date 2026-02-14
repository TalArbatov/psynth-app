import { AudioEngine } from './modules/audio-engine.js';
import { createADSRGraph } from './modules/adsr-graph.js';
import { createPianoKeyboard } from './modules/piano-keyboard.js';
import { createWaveformDisplay } from './modules/waveform-display.js';
import { LFO } from './modules/lfo.js';

// --- Audio engine (2 oscillator voices) ---
const engine = new AudioEngine(2);

// --- LFOs (one per oscillator) ---
const lfos = [new LFO(), new LFO()];
let baseMasterVolume = 0.7;

// --- Default waveforms to match HTML select defaults ---
engine.voices[0].setWaveform('sawtooth');
engine.voices[1].setWaveform('triangle');

// --- ADSR graphs ---
createADSRGraph(
  document.getElementById('adsr1-canvas'),
  document.getElementById('adsr1-values'),
  engine.voices[0].adsr
);
createADSRGraph(
  document.getElementById('adsr2-canvas'),
  document.getElementById('adsr2-values'),
  engine.voices[1].adsr
);

// --- Piano keyboard ---
const keyboard = createPianoKeyboard(
  document.getElementById('keyboard'),
  {
    onNoteOn: freq => engine.noteOn(freq),
    onNoteOff: freq => engine.noteOff(freq),
  }
);

// --- Waveform display ---
const waveform = createWaveformDisplay(
  document.getElementById('waveform-canvas'),
  engine.analyser
);

// --- Animation loop (started before filter graphs so keyboard always works) ---
const drawList = [waveform, keyboard];

function animate() {
  requestAnimationFrame(animate);

  // LFO modulation
  const now = performance.now() / 1000;
  let masterVolMod = 0;
  for (let i = 0; i < 2; i++) {
    const lfo = lfos[i], voice = engine.voices[i];
    const val = lfo.getValue(now);
    if (lfo.hasTarget('filter')) {
      voice.applyModulatedCutoff(voice.cutoff * Math.pow(2, val * 3));
    } else {
      voice.applyModulatedCutoff(voice.cutoff);
    }
    if (lfo.hasTarget('volume')) masterVolMod += val;
  }
  const modVol = Math.max(0, Math.min(1, baseMasterVolume * (1 + masterVolMod)));
  engine.masterGain.gain.setValueAtTime(modVol, engine.audioCtx.currentTime);

  for (const item of drawList) {
    item.draw();
  }
}
animate();

// --- Filter graphs (dynamic import so it can't block the rest of the page) ---
import('./modules/filter-graph.js').then(({ createFilterGraph }) => {
  const fg1 = createFilterGraph(
    document.getElementById('filter1-canvas'),
    document.getElementById('filter1-values'),
    engine.voices[0]
  );
  drawList.push(fg1);

  const fg2 = createFilterGraph(
    document.getElementById('filter2-canvas'),
    document.getElementById('filter2-values'),
    engine.voices[1]
  );
  drawList.push(fg2);
}).catch(e => console.error('Filter graph load failed:', e));

// --- Master volume ---
const masterVolumeSlider = document.getElementById('master-volume');
const masterVolumeVal = document.getElementById('master-volume-val');
masterVolumeSlider.addEventListener('input', () => {
  const vol = parseFloat(masterVolumeSlider.value);
  masterVolumeVal.textContent = vol.toFixed(2);
  baseMasterVolume = vol;
  engine.setMasterVolume(vol);
});

// --- Per-oscillator controls ---
function bindOscControls(voiceIndex, prefix) {
  const voice = engine.voices[voiceIndex];
  const section = document.getElementById(`${prefix}-section`);
  const toggle = document.getElementById(`toggle${voiceIndex + 1}`);
  const waveformSel = document.getElementById(`waveform${voiceIndex + 1}`);
  const volumeSlider = document.getElementById(`volume${voiceIndex + 1}`);
  const volumeVal = document.getElementById(`volume${voiceIndex + 1}-val`);
  const detuneSlider = document.getElementById(`detune${voiceIndex + 1}`);
  const detuneVal = document.getElementById(`detune${voiceIndex + 1}-val`);

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const enabled = !voice.enabled;
    voice.setEnabled(enabled);
    toggle.textContent = enabled ? 'ON' : 'OFF';
    toggle.classList.toggle('on', enabled);
    toggle.classList.toggle('off', !enabled);
    section.classList.toggle('disabled', !enabled);
  });

  waveformSel.addEventListener('change', () => {
    voice.setWaveform(waveformSel.value);
  });

  volumeSlider.addEventListener('input', () => {
    const vol = parseFloat(volumeSlider.value);
    volumeVal.textContent = vol.toFixed(2);
    voice.setVolume(vol);
  });

  detuneSlider.addEventListener('input', () => {
    const cents = parseFloat(detuneSlider.value);
    detuneVal.textContent = detuneSlider.value;
    voice.setDetune(cents);
  });

  const unisonCountSlider = document.getElementById(`unison-count${voiceIndex + 1}`);
  const unisonCountVal = document.getElementById(`unison-count${voiceIndex + 1}-val`);
  const unisonDetuneSlider = document.getElementById(`unison-detune${voiceIndex + 1}`);
  const unisonDetuneVal = document.getElementById(`unison-detune${voiceIndex + 1}-val`);
  const unisonSpreadSlider = document.getElementById(`unison-spread${voiceIndex + 1}`);
  const unisonSpreadVal = document.getElementById(`unison-spread${voiceIndex + 1}-val`);

  unisonCountSlider.addEventListener('input', () => {
    const n = parseInt(unisonCountSlider.value);
    unisonCountVal.textContent = n;
    voice.setUnisonCount(n);
  });

  unisonDetuneSlider.addEventListener('input', () => {
    const cents = parseFloat(unisonDetuneSlider.value);
    unisonDetuneVal.textContent = cents;
    voice.setUnisonDetune(cents);
  });

  unisonSpreadSlider.addEventListener('input', () => {
    const spread = parseFloat(unisonSpreadSlider.value) / 100;
    unisonSpreadVal.textContent = unisonSpreadSlider.value + '%';
    voice.setUnisonSpread(spread);
  });

  const filterTypeSel = document.getElementById(`filter-type${voiceIndex + 1}`);
  filterTypeSel.addEventListener('change', () => {
    voice.setFilterType(filterTypeSel.value);
  });

  const filterToggle = document.getElementById(`filter-toggle${voiceIndex + 1}`);
  const filterSection = document.getElementById(`filter${voiceIndex + 1}-section`);
  filterToggle.addEventListener('click', () => {
    const enabled = !voice.filterEnabled;
    voice.setFilterEnabled(enabled);
    filterToggle.textContent = enabled ? 'ON' : 'OFF';
    filterToggle.classList.toggle('on', enabled);
    filterToggle.classList.toggle('off', !enabled);
    filterSection.classList.toggle('disabled', !enabled);
  });
}

bindOscControls(0, 'osc1');
bindOscControls(1, 'osc2');

// --- LFO controls ---
function bindLFOControls(lfoIndex) {
  const lfo = lfos[lfoIndex];
  const n = lfoIndex + 1;

  const waveformSel = document.getElementById(`lfo-waveform${n}`);
  const rateSlider = document.getElementById(`lfo-rate${n}`);
  const rateVal = document.getElementById(`lfo-rate${n}-val`);
  const depthSlider = document.getElementById(`lfo-depth${n}`);
  const depthVal = document.getElementById(`lfo-depth${n}-val`);
  const phaseSlider = document.getElementById(`lfo-phase${n}`);
  const phaseVal = document.getElementById(`lfo-phase${n}-val`);
  const delaySlider = document.getElementById(`lfo-delay${n}`);
  const delayVal = document.getElementById(`lfo-delay${n}-val`);
  const fadeinSlider = document.getElementById(`lfo-fadein${n}`);
  const fadeinVal = document.getElementById(`lfo-fadein${n}-val`);
  const syncToggle = document.getElementById(`lfo-sync${n}`);
  const bpmInput = document.getElementById(`lfo-bpm${n}`);
  const divisionSelect = document.getElementById(`lfo-division${n}`);
  const oneshotToggle = document.getElementById(`lfo-oneshot${n}`);

  waveformSel.addEventListener('change', () => {
    lfo.waveform = waveformSel.value;
  });

  rateSlider.addEventListener('input', () => {
    lfo.rate = parseFloat(rateSlider.value);
    rateVal.textContent = lfo.rate.toFixed(2);
  });

  depthSlider.addEventListener('input', () => {
    const pct = parseInt(depthSlider.value);
    lfo.depth = pct / 100;
    depthVal.textContent = pct + '%';
  });

  phaseSlider.addEventListener('input', () => {
    lfo.phase = parseInt(phaseSlider.value);
    phaseVal.textContent = lfo.phase + '\u00B0';
  });

  delaySlider.addEventListener('input', () => {
    lfo.delay = parseFloat(delaySlider.value);
    delayVal.textContent = lfo.delay.toFixed(2);
  });

  fadeinSlider.addEventListener('input', () => {
    lfo.fadeIn = parseFloat(fadeinSlider.value);
    fadeinVal.textContent = lfo.fadeIn.toFixed(2);
  });

  syncToggle.addEventListener('click', () => {
    lfo.bpmSync = !lfo.bpmSync;
    syncToggle.classList.toggle('on', lfo.bpmSync);
    syncToggle.classList.toggle('off', !lfo.bpmSync);
    bpmInput.disabled = !lfo.bpmSync;
    divisionSelect.disabled = !lfo.bpmSync;
    rateSlider.disabled = lfo.bpmSync;
  });

  bpmInput.addEventListener('input', () => {
    lfo.bpm = parseFloat(bpmInput.value) || 120;
  });

  divisionSelect.addEventListener('change', () => {
    lfo.syncDivision = divisionSelect.value;
  });

  oneshotToggle.addEventListener('click', () => {
    lfo.oneShot = !lfo.oneShot;
    oneshotToggle.classList.toggle('on', lfo.oneShot);
    oneshotToggle.classList.toggle('off', !lfo.oneShot);
  });

  // One-shot retrigger on note-on
  engine.voices[lfoIndex].onNoteOn = () => {
    if (lfo.oneShot) lfo.reset();
  };
}

bindLFOControls(0);
bindLFOControls(1);

// --- Drag-and-drop routing ---
function initDragDrop() {
  const dropTargets = document.querySelectorAll('[data-drop-target]');

  // Dragstart on MOD chips
  document.querySelectorAll('.lfo-mod-chip').forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', chip.dataset.lfo);
      e.dataTransfer.effectAllowed = 'link';
      // Highlight valid targets
      const lfoIdx = parseInt(chip.dataset.lfo);
      dropTargets.forEach(target => {
        const type = target.dataset.dropTarget;
        const oscNum = target.dataset.osc;
        // LFO can target its own osc's filter or master volume
        if (type === 'volume' || (type === 'filter' && parseInt(oscNum) === lfoIdx + 1)) {
          target.classList.add('drop-target-active');
        }
      });
    });

    chip.addEventListener('dragend', () => {
      dropTargets.forEach(target => {
        target.classList.remove('drop-target-active', 'drop-target-hover');
      });
    });
  });

  // Drop targets
  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      const lfoIdx = parseInt(e.dataTransfer.types.includes('text/plain') ? '0' : '-1');
      if (target.classList.contains('drop-target-active')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
        target.classList.add('drop-target-hover');
      }
    });

    target.addEventListener('dragleave', () => {
      target.classList.remove('drop-target-hover');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('drop-target-hover', 'drop-target-active');
      const lfoIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const lfo = lfos[lfoIdx];
      const type = target.dataset.dropTarget;
      const oscNum = target.dataset.osc;

      // Validate: LFO can only target its own osc's filter or master volume
      if (type === 'filter' && parseInt(oscNum) !== lfoIdx + 1) return;

      // Toggle target
      if (lfo.hasTarget(type)) {
        lfo.removeTarget(type);
      } else {
        lfo.addTarget(type);
        lfo.reset();
      }
      updateTargetBadges(lfoIdx);

      // Clean up all highlights
      dropTargets.forEach(t => t.classList.remove('drop-target-active'));
    });
  });
}

function updateTargetBadges(lfoIdx) {
  const container = document.getElementById(`lfo${lfoIdx + 1}-targets`);
  container.innerHTML = '';
  const lfo = lfos[lfoIdx];
  for (const target of lfo.targets) {
    const badge = document.createElement('span');
    badge.className = 'lfo-target-badge';
    const label = target === 'filter' ? `Filter ${lfoIdx + 1}` : 'Master Vol';
    badge.innerHTML = `${label} <span class="badge-remove">\u00D7</span>`;
    badge.querySelector('.badge-remove').addEventListener('click', () => {
      lfo.removeTarget(target);
      updateTargetBadges(lfoIdx);
    });
    container.appendChild(badge);
  }
}

initDragDrop();

// --- Tab switching ---
const oscTabs = document.querySelectorAll('.osc-tab');
const oscSections = document.querySelectorAll('.osc-section');

oscTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const oscNum = tab.dataset.osc;
    oscTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    oscSections.forEach(s => s.classList.add('hidden'));
    document.getElementById(`osc${oscNum}-section`).classList.remove('hidden');
  });
});
