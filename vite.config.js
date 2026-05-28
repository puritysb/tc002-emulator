import { defineConfig } from 'vite';
import { WebSocketServer } from 'ws';

export default defineConfig({
    base: '/tc002-emulator/',
    server: {
        port: 54200,
        strictPort: true
    },
    plugins: [
        {
            name: 'websocket-server',
            configureServer(server) {
                if (!server.httpServer) return;
                
                server.httpServer.once('listening', () => {
                    const wss = new WebSocketServer({ server: server.httpServer });
                    
                    wss.on('connection', (ws) => {
                        console.log('[Emulator WS] Client connected');
                        
                        ws.on('message', (message) => {
                            wss.clients.forEach((client) => {
                                if (client !== ws && client.readyState === 1) {
                                    client.send(message);
                                }
                            });
                        });

                        ws.on('close', () => {
                            console.log('[Emulator WS] Client disconnected');
                        });
                    });
                });
            }
        }
    ]
});
