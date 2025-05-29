const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: false
  },
  shift: {
    type: String
  },
  faceId: {
    type: String
  },
  registrationDate: {
    type: Date
  }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee; 