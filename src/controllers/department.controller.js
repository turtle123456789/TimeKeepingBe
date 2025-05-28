const departmentService = require('../services/department.service');

const departmentController = {
  getAllDepartments: async (req, res) => {
    try {
      const departments = await departmentService.getAllDepartments();
      res.status(200).json(departments);
    } catch (error) {
      console.error('Error in departmentController.getAllDepartments:', error);
      res.status(500).json({ message: error.message });
    }
  },

  createDepartment: async (req, res) => {
    try {
      const departmentData = req.body;
      const newDepartment = await departmentService.createDepartment(departmentData);
      res.status(201).json(newDepartment);
    } catch (error) {
      console.error('Error in departmentController.createDepartment:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updateDepartment: async (req, res) => {
    try {
      const departmentId = req.params.departmentId;
      const updateData = req.body;
      const updatedDepartment = await departmentService.updateDepartment(departmentId, updateData);
      if (!updatedDepartment) {
        return res.status(404).json({ message: 'Department not found.' });
      }
      res.status(200).json(updatedDepartment);
    } catch (error) {
      console.error('Error in departmentController.updateDepartment:', error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteDepartment: async (req, res) => {
    try {
      const departmentId = req.params.departmentId;
      const deletedDepartment = await departmentService.deleteDepartment(departmentId);
      if (!deletedDepartment) {
        return res.status(404).json({ message: 'Department not found.' });
      }
      res.status(200).json({ message: 'Department deleted successfully.' });
    } catch (error) {
      console.error('Error in departmentController.deleteDepartment:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = departmentController; 