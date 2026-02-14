export function createSync() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}`);
    let _receiving = false;
    const _handlers = [];
    ws.addEventListener('message', (e) => {
        const msg = JSON.parse(e.data);
        _receiving = true;
        try {
            for (const h of _handlers)
                h(msg);
        }
        finally {
            _receiving = false;
        }
    });
    return {
        send(msg) {
            if (_receiving)
                return;
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg));
            }
        },
        onMessage(fn) {
            _handlers.push(fn);
        },
        get receiving() { return _receiving; }
    };
}
//# sourceMappingURL=sync.js.map