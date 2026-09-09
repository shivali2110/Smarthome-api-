const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');

const { attachConnectionHandlers } = require('./websocket');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Smart Home API is running!' });
});

// Existing routes
app.use('/api/auth',   require('./src/routes/authRoutes'));
app.use('/api/spaces',          require('./src/routes/spaceRoutes'));
app.use('/api/rooms',           require('./src/routes/roomRoutes'));
app.use('/api/switch-boards',   require('./src/routes/switchBoardRoutes'));
app.use('/api/switch-types',    require('./src/routes/switchTypeRoutes'));
app.use('/api/switches',        require('./src/routes/switchRoutes'));
app.use('/api/users',           require('./src/routes/userRoutes'));
app.use('/api/devices',         require('./src/routes/deviceRoutes'));
app.use('/api/beacons',         require('./src/routes/beaconRoutes'));
app.use('/api/scenes',          require('./src/routes/sceneRoutes'));
app.use('/api/beacon-scenes',   require('./src/routes/beaconSceneRoutes'));
app.use('/api/upload',          require('./src/routes/uploadRoutes'));
app.use('/api/boards', require('./src/routes/switchBoardRoutes'));

// New routes
app.use('/api/switch-functions',      require('./src/routes/switchFunctionRoutes'));
app.use('/api/scene-actions',         require('./src/routes/sceneActionRoutes'));
app.use('/api/beacon-scene-actions',  require('./src/routes/beaconSceneActionRoutes'));
app.use('/api/user-space-access',     require('./src/routes/userSpaceAccessRoutes'));
app.use('/api/invites',               require('./src/routes/inviteRoutes'));
app.use('/api/scene-logs',            require('./src/routes/sceneLogRoutes'));
app.use('/api/beacon-scene-logs',     require('./src/routes/beaconSceneLogRoutes'));
app.use('/api/activity-logs',         require('./src/routes/activityLogRoutes'));
app.use('/api/login-logs',            require('./src/routes/loginLogRoutes'));

const PORT = process.env.PORT || 3000;

// Create a plain HTTP server from the Express app instead of using
// app.listen() directly, so the same server can also handle WebSocket
// upgrade requests (ws:// connections come in over the same port).
const httpServer = http.createServer(app);

// Attach a WebSocket server on top of the same HTTP server.
// No separate port needed - devices/mobile/dashboard connect to
// ws://<host>:<PORT> instead of a dedicated ws port.
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: httpServer });
attachConnectionHandlers(wss);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});