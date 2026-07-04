const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Smart Home API is running!' });
});

// Routes
app.use('/api/spaces',        require('./src/routes/spaceRoutes'));
app.use('/api/rooms',         require('./src/routes/roomRoutes'));
app.use('/api/switch-boards', require('./src/routes/switchBoardRoutes'));
app.use('/api/switch-types',  require('./src/routes/switchTypeRoutes'));
app.use('/api/switches',      require('./src/routes/switchRoutes'));
app.use('/api/users',         require('./src/routes/userRoutes'));
app.use('/api/devices',       require('./src/routes/deviceRoutes'));
app.use('/api/beacons',       require('./src/routes/beaconRoutes'));
app.use('/api/scenes',        require('./src/routes/sceneRoutes'));
app.use('/api/beacon-scenes', require('./src/routes/beaconSceneRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});