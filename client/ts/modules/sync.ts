import type { SyncMessage } from './types.js';

export interface SyncClient {
  send(msg: SyncMessage): void;
  onMessage(fn: (msg: SyncMessage) => void): void;
  readonly receiving: boolean;
}

export function createSync(): SyncClient {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}`);

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
