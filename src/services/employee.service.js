const Employee = require('../models/employee.model');

const employeeService = {
  createEmployee: async (employeeData) => {
    try {
      const newEmployee = new Employee(employeeData);
      await newEmployee.save();
      return newEmployee;
    } catch (error) {
      throw new Error('Could not create employee: ' + error.message);
    }
  },

  updateEmployee: async (employeeId, updateData) => {
    try {
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId: employeeId },
        updateData,
        { new: true }
      );
      return updatedEmployee;
    } catch (error) {
      throw new Error('Could not update employee: ' + error.message);
    }
  },

  deleteEmployee: async (employeeId) => {
    try {
      const deletedEmployee = await Employee.findOneAndDelete({ employeeId: employeeId });
      return deletedEmployee;
    } catch (error) {
      throw new Error('Could not delete employee: ' + error.message);
    }
  },

  getAllEmployees: async () => {
    try {
      const employees = await Employee.find();
      return employees;
    } catch (error) {
      throw new Error('Could not retrieve employees: ' + error.message);
    }
  }
};

module.exports = employeeService; 