/**
 * Builds the DOM for one oscillator's LFO section (4 LFO panels with tabs).
 * Must run before upgradeAllSliders() so that dynamically-created range
 * inputs exist in the DOM for the knob upgrade pass.
 */

/**
 * Generate the LFO tab bar and four parameter panels for the given oscillator.
 * @param oscN  1-based oscillator number (1 or 2)
 */
export function buildLFOSection(oscN: number): void {
  const container = document.getElementById(`lfo-section-${oscN}`)!;
  let tabsHTML = '<div class="lfo-tabs">';
  let panelsHTML = '';
  for (let l = 1; l <= 4; l++) {
    const active = l === 1 ? ' active' : '';
    tabsHTML += `<button class="lfo-tab${active}" data-lfo-osc="${oscN}" data-lfo-idx="${l}">LFO ${l}</button>`;
    panelsHTML += `
      <div class="lfo-panel${active}" id="lfo-panel-${oscN}-${l}">
        <div class="lfo-header">
          <span class="lfo-label">LFO ${l}</span>
          <div class="lfo-mod-chip" id="lfo-chip-${oscN}-${l}" draggable="true" data-lfo-osc="${oscN}" data-lfo-idx="${l}">MOD</div>
        </div>
        <div class="controls">
          <div class="control-group">
            <label>Waveform</label>
            <select id="lfo-waveform-${oscN}-${l}">
              <option value="sine" selected>Sine</option>
              <option value="triangle">Triangle</option>
              <option value="square">Square</option>
              <option value="sawtooth">Sawtooth</option>
            </select>
            <canvas class="waveform-preview" id="lfo-waveform-${oscN}-${l}-preview" width="120" height="30"></canvas>
          </div>
          <div class="control-group">
            <label>Rate (Hz)</label>
            <input type="range" id="lfo-rate-${oscN}-${l}" min="0.05" max="20" step="0.05" value="1">
            <div class="value-display" id="lfo-rate-${oscN}-${l}-val">1.00</div>
          </div>
          <div class="control-group">
            <label>Depth</label>
            <input type="range" id="lfo-depth-${oscN}-${l}" min="0" max="100" step="1" value="50">
            <div class="value-display" id="lfo-depth-${oscN}-${l}-val">50%</div>
          </div>
        </div>
        <div class="controls">
          <div class="control-group">
            <label>Phase</label>
            <input type="range" id="lfo-phase-${oscN}-${l}" min="0" max="360" step="1" value="0">
            <div class="value-display" id="lfo-phase-${oscN}-${l}-val">0\u00B0</div>
          </div>
          <div class="control-group">
            <label>Delay (s)</label>
            <input type="range" id="lfo-delay-${oscN}-${l}" min="0" max="5" step="0.05" value="0">
            <div class="value-display" id="lfo-delay-${oscN}-${l}-val">0.00</div>
          </div>
          <div class="control-group">
            <label>Fade In (s)</label>
            <input type="range" id="lfo-fadein-${oscN}-${l}" min="0" max="5" step="0.05" value="0">
            <div class="value-display" id="lfo-fadein-${oscN}-${l}-val">0.00</div>
          </div>
        </div>
        <div class="lfo-sync-row">
          <button class="lfo-sync-toggle off" id="lfo-sync-${oscN}-${l}">SYNC</button>
          <input type="number" class="lfo-bpm-input" id="lfo-bpm-${oscN}-${l}" value="120" min="20" max="300" disabled>
          <select class="lfo-division-select" id="lfo-division-${oscN}-${l}" disabled>
            <option value="1/1">1/1</option>
            <option value="1/2">1/2</option>
            <option value="1/4" selected>1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
          </select>
          <button class="lfo-oneshot-toggle off" id="lfo-oneshot-${oscN}-${l}">1-SHOT</button>
        </div>
        <div class="lfo-targets" id="lfo-targets-${oscN}-${l}"></div>
      </div>`;
  }
  tabsHTML += '</div>';
  container.innerHTML = tabsHTML + panelsHTML;

  // Tab click handlers
  container.querySelectorAll('.lfo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = (tab as HTMLElement).dataset.lfoIdx;
      container.querySelectorAll('.lfo-tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.lfo-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`lfo-panel-${oscN}-${idx}`)!.classList.add('active');
    });
  });
}
