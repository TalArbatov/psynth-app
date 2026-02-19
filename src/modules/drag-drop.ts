/** LFO modulation drag-and-drop routing and target badge management. */

import type { LFO } from './lfo.js';

function updateTargetBadges(lfos: LFO[][], oscIndex: number, lfoIndex: number): void {
  const o = oscIndex + 1;
  const l = lfoIndex + 1;
  const container = document.getElementById(`lfo-targets-${o}-${l}`)!;
  container.innerHTML = '';
  const lfo = lfos[oscIndex][lfoIndex];
  for (const target of lfo.targets) {
    const badge = document.createElement('span');
    badge.className = 'lfo-target-badge';
    const label = target === 'filter' ? `Filter ${o}` : 'Master Vol';
    badge.innerHTML = `${label} <span class="badge-remove">\u00D7</span>`;
    badge.querySelector('.badge-remove')!.addEventListener('click', () => {
      lfo.removeTarget(target);
      updateTargetBadges(lfos, oscIndex, lfoIndex);
    });
    container.appendChild(badge);
  }
}

/**
 * Initialize drag-and-drop from LFO MOD chips to filter/volume drop targets.
 * @param lfos  2D array of LFO instances [oscIndex][lfoIndex]
 */
export function initDragDrop(lfos: LFO[][]): void {
  const dropTargets = document.querySelectorAll<HTMLElement>('[data-drop-target]');

  document.querySelectorAll<HTMLElement>('.lfo-mod-chip').forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      const oscN = parseInt(chip.dataset.lfoOsc!);
      const lfoN = parseInt(chip.dataset.lfoIdx!);
      e.dataTransfer!.setData('text/plain', `${oscN},${lfoN}`);
      e.dataTransfer!.effectAllowed = 'link';
      // Highlight valid targets: own osc's filter or master volume
      dropTargets.forEach(target => {
        const type = target.dataset.dropTarget;
        const oscNum = target.dataset.osc;
        if (type === 'volume' || (type === 'filter' && parseInt(oscNum!) === oscN)) {
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

  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      if (target.classList.contains('drop-target-active')) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'link';
        target.classList.add('drop-target-hover');
      }
    });

    target.addEventListener('dragleave', () => {
      target.classList.remove('drop-target-hover');
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('drop-target-hover', 'drop-target-active');
      const parts = e.dataTransfer!.getData('text/plain').split(',');
      const oscN = parseInt(parts[0]);
      const lfoN = parseInt(parts[1]);
      const oscIndex = oscN - 1;
      const lfoIndex = lfoN - 1;
      const lfo = lfos[oscIndex][lfoIndex];
      const type = target.dataset.dropTarget!;
      const oscNum = target.dataset.osc;

      // LFO can only target its own osc's filter
      if (type === 'filter' && parseInt(oscNum!) !== oscN) return;

      if (lfo.hasTarget(type as 'filter' | 'volume')) {
        lfo.removeTarget(type as 'filter' | 'volume');
      } else {
        lfo.addTarget(type as 'filter' | 'volume');
        lfo.reset();
      }
      updateTargetBadges(lfos, oscIndex, lfoIndex);

      dropTargets.forEach(t => t.classList.remove('drop-target-active'));
    });
  });
}
