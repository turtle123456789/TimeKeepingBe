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
    type: String
  },
  position: {
    type: String
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