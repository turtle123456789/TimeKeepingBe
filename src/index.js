const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/mqtt.config');
const MQTTService = require('./services/mqtt.service');
const SocketController = require('./controllers/socket.controller');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize services and controllers
const mqttService = new MQTTService(io);
const socketController = new SocketController(io);

// Connect to MQTT broker
mqttService.connect();

// Initialize Socket.IO controller
socketController.initialize();

// Start the server
server.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`);
}); 