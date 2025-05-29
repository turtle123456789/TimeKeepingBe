const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  faceId: {
    type: String,
    required: false
  },
  checkinStatus: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

const Checkin = mongoose.model('Checkin', checkinSchema);

module.exports = Checkin; 