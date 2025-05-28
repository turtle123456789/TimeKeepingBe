const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  topic: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  processed: {
    type: Boolean,
    required: true,
    default: false
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }
}, {
  timestamps: true
});

const Checkin = mongoose.model('Checkin', checkinSchema);

module.exports = Checkin; 