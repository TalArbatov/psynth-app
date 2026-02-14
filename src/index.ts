import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const msg = data.toString();
        for (const client of wss.clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    });
});

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
