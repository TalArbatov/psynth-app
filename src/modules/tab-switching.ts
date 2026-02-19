/** Wires up main page tabs (OSC/FX) and oscillator sub-tabs (Osc1/Osc2). */

export function initTabSwitching(): void {
  const mainTabs = document.querySelectorAll<HTMLElement>('.main-tab');
  const mainPages = document.querySelectorAll<HTMLElement>('.main-page');

  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const page = tab.dataset.page!;
      mainTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mainPages.forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${page}`)!.classList.add('active');
    });
  });

  const oscTabs = document.querySelectorAll<HTMLElement>('.osc-tab');
  const oscSections = document.querySelectorAll<HTMLElement>('.osc-section');

  oscTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const oscNum = tab.dataset.osc!;
      oscTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      oscSections.forEach(s => s.classList.add('hidden'));
      document.getElementById(`osc${oscNum}-section`)!.classList.remove('hidden');
    });
  });
}
