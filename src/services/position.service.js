const Position = require('../models/position.model');

const positionService = {
  // Get all positions and populate department name
  getAllPositions: async () => {
    try {
      // Use populate to get department details
      const positions = await Position.find({}).populate('department', 'name'); // Populate 'department' field, only select 'name'
      return positions;
    } catch (error) {
      throw new Error('Could not retrieve positions: ' + error.message);
    }
  },

  // Update a position's name
  updatePosition: async (positionId, updateData) => {
    try {
      // Ensure only the 'name' field can be updated
      const allowedUpdates = ['name'];
      const updates = Object.keys(updateData);
      const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

      if (!isValidOperation) {
          throw new Error('Invalid updates!');
      }

      // Find and update the position by ID
      const updatedPosition = await Position.findByIdAndUpdate(positionId, { name: updateData.name }, { new: true });
      return updatedPosition;
    } catch (error) {
      throw new Error('Could not update position: ' + error.message);
    }
  },

  // Delete a position
  deletePosition: async (positionId) => {
    try {
      const deletedPosition = await Position.findByIdAndDelete(positionId);
      return deletedPosition;
    } catch (error) {
      throw new Error('Could not delete position: ' + error.message);
    }
  },

  // Get positions by department ID and populate department name
  getPositionsByDepartment: async (departmentId) => {
    try {
      const positions = await Position.find({ department: departmentId }).populate('department', 'name');
      return positions;
    } catch (error) {
      throw new Error('Could not retrieve positions for department: ' + error.message);
    }
  }
};

module.exports = positionService; 