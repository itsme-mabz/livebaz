const WebSocket = require('ws');

let localWsServer;
let externalWs;

const initSocket = (server) => {
    // Shared WebSocket server on the same port as Express
    localWsServer = new WebSocket.Server({ server });

    localWsServer.on('connection', (ws) => {
        console.log('Client connected to local WebSocket');

        ws.on('close', () => {
            console.log('Client disconnected from local WebSocket');
        });
    });

    connectToExternalWs();
};

const connectToExternalWs = () => {
    const apiKey = process.env.APIFOOTBALL_KEY;
    if (!apiKey) {
        console.error("APIFOOTBALL_KEY not found in environment variables");
        return;
    }

    const wsUrl = `wss://wss.apifootball.com/livescore?APIkey=${apiKey}&timezone=+03:00`;
    console.log("Connecting to External WebSocket...");

    externalWs = new WebSocket(wsUrl);

    externalWs.on('open', () => {
        console.log("Connected to APIFootball External WebSocket");
    });

    externalWs.on('message', (data) => {
        try {
            // Buffer to string if necessary
            const messageStr = data.toString();
            const message = JSON.parse(messageStr);

            // Broadcast to all local clients
            if (localWsServer) {
                localWsServer.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(messageStr);
                    }
                });
            }
        } catch (e) {
            // Some messages might not be JSON, skip or handle accordingly
        }
    });

    externalWs.on('error', (error) => {
        console.error("External WebSocket error:", error.message);
    });

    externalWs.on('close', (code, reason) => {
        console.log(`External WebSocket closed (Code: ${code}). Reconnecting in 5 seconds...`);
        setTimeout(connectToExternalWs, 5000);
    });
};

module.exports = { initSocket };
