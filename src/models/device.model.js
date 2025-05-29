const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  },
  location: {
    type: String
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device; 