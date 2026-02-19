/**
 * Small typed DOM helpers to keep bootstrap code readable and fail fast
 * when required elements are missing.
 */
function mustGetElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing required element: #${id}`);
  }
  return el as T;
}

export function byId(id: string): HTMLElement {
  return mustGetElement<HTMLElement>(id);
}

export function byInputId(id: string): HTMLInputElement {
  return mustGetElement<HTMLInputElement>(id);
}

export function byCanvasId(id: string): HTMLCanvasElement {
  return mustGetElement<HTMLCanvasElement>(id);
}

