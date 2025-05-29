const positionService = require('../services/position.service');
const mongoose = require('mongoose'); 
const departmentService = require('../services/department.service'); 

const positionController = {
  getAllPositions: async (req, res) => {
    try {
      const positions = await positionService.getAllPositions();
      res.status(200).json(positions);
    } catch (error) {
      console.error('Error in positionController.getAllPositions:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updatePosition: async (req, res) => {
    try {
      const positionId = req.params.positionId;
      const updateData = req.body; 

      if (!updateData || typeof updateData.name !== 'string') {
          return res.status(400).json({ message: 'Invalid update data. Only \'name\' (string) is allowed.' });
      }

      const updatedPosition = await positionService.updatePosition(positionId, { name: updateData.name });
      if (!updatedPosition) {
        return res.status(404).json({ message: 'Position not found.' });
      }
      res.status(200).json(updatedPosition);
    } catch (error) {
      console.error('Error in positionController.updatePosition:', error);
      if (error.message === 'Invalid updates!') {
          res.status(400).json({ message: 'Invalid update data. Only \'name\' (string) is allowed.' });
      } else {
          res.status(500).json({ message: error.message });
      }
    }
  },

  deletePosition: async (req, res) => {
    try {
      const positionId = req.params.positionId;
      const deletedPosition = await positionService.deletePosition(positionId);
      if (!deletedPosition) {
        return res.status(404).json({ message: 'Position not found.' });
      }
      res.status(200).json({ message: 'Position deleted successfully.' });
    } catch (error) {
      console.error('Error in positionController.deletePosition:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getPositionsByDepartment: async (req, res) => {
    try {
      const departmentId = req.params.departmentId;
      let positions;

      if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
          const departmentExists = await departmentService.getDepartmentById(departmentId);

          if (departmentExists) {
              console.log(`Fetching positions for existing department ID: ${departmentId}`);
              positions = await positionService.getPositionsByDepartment(departmentId);
          } else {
              console.log(`Department with ID ${departmentId} not found. Fetching all positions.`);
              positions = await positionService.getAllPositions();
          }
      } else {
          console.log('Department ID not provided or invalid format. Fetching all positions.');
          positions = await positionService.getAllPositions();
      }

      res.status(200).json(positions);
    } catch (error) {
      console.error('Error in positionController.getPositionsByDepartment:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = positionController; 