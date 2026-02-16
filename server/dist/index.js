"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const ws_server_1 = require("./websocket/ws-server");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const app = (0, app_1.createApp)();
const server = (0, http_1.createServer)(app);
(0, ws_server_1.createWebSocketServer)(server);
server.listen(config_1.config.port, () => {
    logger_1.logger.info(`Server listening on port ${config_1.config.port}`);
});
