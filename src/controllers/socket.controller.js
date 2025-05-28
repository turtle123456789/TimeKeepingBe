class SocketController {
  constructor(io) {
    this.io = io;
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
}

module.exports = SocketController; 