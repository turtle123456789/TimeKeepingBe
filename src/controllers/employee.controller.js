const employeeService = require('../services/employee.service');

const employeeController = {
  registerEmployee: async (req, res) => {
    try {
      const employeeData = req.body;

      if (!employeeData.employeeId || !employeeData.fullName) {
        return res.status(409).json({ message: 'Missing required fields: employeeId and fullName are required.' });
      }

      if (employeeData.faceId !== undefined && typeof employeeData.faceId !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: faceId must be a string if provided.' });
      }
      if (employeeData.department !== undefined && typeof employeeData.department !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: department must be a string if provided.' });
      }
      if (employeeData.position !== undefined && typeof employeeData.position !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: position must be a string if provided.' });
      }

      const newEmployee = await employeeService.createEmployee(employeeData);
      res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Error in employeeController.registerEmployee:', error);

      res.status(500).json({ message: error.message });
    }
  },

  updateEmployee: async (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const updateData = req.body;

      if (updateData.faceId !== undefined && typeof updateData.faceId !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: faceId must be a string if provided.' });
      }
      if (updateData.department !== undefined && typeof updateData.department !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: department must be a string if provided.' });
      }
      if (updateData.position !== undefined && typeof updateData.position !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: position must be a string if provided.' });
      }
      if (updateData.fullName !== undefined && typeof updateData.fullName !== 'string') {
        return res.status(409).json({ message: 'Invalid field type: fullName must be a string if provided.' });
      }
      if (updateData.employeeId) {
           return res.status(400).json({ message: 'employeeId cannot be updated via this endpoint.' });
      }

      const updatedEmployee = await employeeService.updateEmployee(employeeId, updateData);

      if (!updatedEmployee) {
        return res.status(404).json({ message: 'Employee not found.' });
      }

      res.status(200).json(updatedEmployee);
    } catch (error) {
      console.error('Error in employeeController.updateEmployee:', error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteEmployee: async (req, res) => {
    try {
      const employeeId = req.params.employeeId;
      const deletedEmployee = await employeeService.deleteEmployee(employeeId);

      if (!deletedEmployee) {
        return res.status(404).json({ message: 'Employee not found.' });
      }

      res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
      console.error('Error in employeeController.deleteEmployee:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllEmployees: async (req, res) => {
    try {
      const employees = await employeeService.getAllEmployees();
      res.status(200).json(employees);
    } catch (error) {
      console.error('Error in employeeController.getAllEmployees:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = employeeController; 