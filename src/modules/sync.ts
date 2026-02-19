import type { SyncMessage } from './types.js';

export interface SyncClient {
  send(msg: SyncMessage): void;
  onMessage(fn: (msg: SyncMessage) => void): void;
  readonly receiving: boolean;
}

/**
 * @param baseUrl  Optional HTTP(S) base URL of the backend (e.g. from API_BASE_URL).
 *                 Converted to ws(s):// automatically. Falls back to location.host.
 */
export function createSync(baseUrl?: string): SyncClient {
  let wsUrl: string;
  if (baseUrl) {
    // http://host:port → ws://host:port, https://… → wss://…
    wsUrl = baseUrl.replace(/^http/, 'ws');
  } else {
    // No explicit base URL — connect via the same host (Vite proxy in dev)
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${location.host}/ws`;
  }
  const ws = new WebSocket(wsUrl);

  let _receiving = false;
  const _handlers: Array<(msg: SyncMessage) => void> = [];

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data) as SyncMessage;
    _receiving = true;
    try {
      for (const h of _handlers) h(msg);
    } finally {
      _receiving = false;
    }
  });

  return {
    send(msg: SyncMessage) {
      if (_receiving) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    onMessage(fn: (msg: SyncMessage) => void) {
      _handlers.push(fn);
    },
    get receiving() { return _receiving; }
  };
}
