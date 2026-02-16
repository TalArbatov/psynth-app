import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import type { Server } from 'http';

export function createWebSocketServer(server: Server): WebSocketServer {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        logger.info('WebSocket client connected', { clients: wss.clients.size });

        ws.on('message', (data) => {
            const msg = data.toString();
            let parsed: unknown;
            try {
                parsed = JSON.parse(msg);
            } catch {
                logger.warn('Received malformed WebSocket message', { raw: msg.slice(0, 200) });
                return;
            }

            logger.debug('WebSocket message', { type: (parsed as Record<string, unknown>).t });

            for (const client of wss.clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(msg);
                }
            }
        });

        ws.on('close', () => {
            logger.info('WebSocket client disconnected', { clients: wss.clients.size });
        });

        ws.on('error', (err) => {
            logger.error('WebSocket client error', { message: err.message });
        });
    });

    return wss;
}
