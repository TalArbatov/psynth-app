import { createServer } from 'http';
import { createApp } from './app';
import { createWebSocketServer } from './websocket/ws-server';
import { config } from './config';
import { logger } from './utils/logger';

const app = createApp();
const server = createServer(app);

createWebSocketServer(server);

server.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
});
