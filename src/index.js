const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Import mongoose
const config = require('./config/mqtt.config');
const MQTTService = require('./services/mqtt.service');
const SocketController = require('./controllers/socket.controller');
const employeeRoutes = require('./routes/employee.routes'); // Import employee routes

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware to parse JSON requests
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mqtt_socket_db';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize services and controllers
const mqttService = new MQTTService(io);
const socketController = new SocketController(io);

// Use employee routes
app.use('/api/employees', employeeRoutes);

// Connect to MQTT broker
mqttService.connect();

// Initialize Socket.IO controller
socketController.initialize();

// Start the server
server.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`);
}); 