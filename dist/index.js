"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const ws_1 = require("ws");
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'client')));
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const msg = data.toString();
        for (const client of wss.clients) {
            if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(msg);
            }
        }
    });
});
server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
