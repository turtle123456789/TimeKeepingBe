const Department = require('../models/department.model');
const Position = require('../models/position.model');

const departmentService = {
  // Get all departments with the count of positions in each
  getAllDepartments: async () => {
    try {
      const departments = await Department.aggregate([
        {
          $lookup: {
            from: 'positions', // The collection name for Position model
            localField: '_id',
            foreignField: 'department',
            as: 'positions'
          }
        },
        {
          $addFields: {
            positionCount: { $size: '$positions' }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            positionCount: 1
          }
        }
      ]);
      return departments;
    } catch (error) {
      throw new Error('Could not retrieve departments: ' + error.message);
    }
  },

  // Create a new department
  createDepartment: async (departmentData) => {
    try {
      const newDepartment = new Department(departmentData);
      await newDepartment.save();
      return newDepartment;
    } catch (error) {
      throw new Error('Could not create department: ' + error.message);
    }
  },

  // Update a department
  updateDepartment: async (departmentId, updateData) => {
    try {
      const updatedDepartment = await Department.findByIdAndUpdate(departmentId, updateData, { new: true });
      return updatedDepartment;
    } catch (error) {
      throw new Error('Could not update department: ' + error.message);
    }
  },

  // Delete a department (and remove associated positions)
  deleteDepartment: async (departmentId) => {
    try {
      // Remove positions associated with the department
      await Position.deleteMany({ department: departmentId });

      // Delete the department
      const deletedDepartment = await Department.findByIdAndDelete(departmentId);
      return deletedDepartment;
    } catch (error) {
      throw new Error('Could not delete department: ' + error.message);
    }
  },

  // Get a department by ID
  getDepartmentById: async (departmentId) => {
    try {
      const department = await Department.findById(departmentId);
      return department; // Returns department document or null if not found
    } catch (error) {
      throw new Error('Could not retrieve department: ' + error.message);
    }
  },

  getDepartmentByName: async (name) => {
    try {
      const department = await Department.findOne({ name: name });
      return department;
    } catch (error) {
      console.error('Error in getDepartmentByName:', error);
      throw error;
    }
  }
};

module.exports = departmentService; 