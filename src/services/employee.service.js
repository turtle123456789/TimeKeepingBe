const Employee = require('../models/employee.model');
const Checkin = require('../models/checkin.model');
const Department = require('../models/department.model');
const Position = require('../models/position.model');

const employeeService = {
  getEmployeeByEmployeeId: async (employeeId) => {
    try {
      const employee = await Employee.findOne({ employeeId })
        .populate('department', 'name')
        .populate('position', 'name');
      return employee;
    } catch (error) {
      console.error('Error in getEmployeeByEmployeeId:', error);
      throw error;
    }
  },

  getAllEmployees: async () => {
    try {
      const employees = await Employee.find()
        .populate('department', 'name')
        .populate('position', 'name');
      return employees;
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      throw error;
    }
  },

  createEmployee: async (employeeData) => {
    try {
      const newEmployee = new Employee(employeeData);
      await newEmployee.save();
      return newEmployee.populate([
        { path: 'department', select: 'name' },
        { path: 'position', select: 'name' }
      ]);
    } catch (error) {
      console.error('Error in createEmployee:', error);
      throw error;
    }
  },

  updateEmployee: async (employeeId, updateData) => {
    try {
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId },
        updateData,
        { new: true }
      ).populate([
        { path: 'department', select: 'name' },
        { path: 'position', select: 'name' }
      ]);
      return updatedEmployee;
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      throw error;
    }
  },

  deleteEmployee: async (employeeId) => {
    try {
      const deletedEmployee = await Employee.findOneAndDelete({ employeeId });
      return deletedEmployee;
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      throw error;
    }
  },

  recordCheckin: async (deviceID, employeeIdString, timestamp, faceId, checkinStatus) => {
    try {
      const employee = await Employee.findOne({ employeeId: employeeIdString })
        .populate('department', 'name')
        .populate('position', 'name');
      let employeeId = null;

      if (employee) {
        employeeId = employee._id;
      }

      const newCheckin = new Checkin({
        deviceId: deviceID,
        employeeId: employeeId,
        timestamp: new Date(timestamp),
        faceId: faceId,
        checkinStatus: checkinStatus
      });
      await newCheckin.save();

      return {
        status: 201,
        message: 'Check-in recorded successfully',
        data: newCheckin
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not record check-in: ' + error.message,
        data: null
      };
    }
  },

  getEmployeeByEmployeeIdString: async (employeeIdString) => {
    try {
      const employee = await Employee.findOne({ employeeId: employeeIdString })
        .populate('department', 'name')
        .populate('position', 'name');

      if (!employee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      return {
        status: 200,
        message: 'Employee retrieved successfully',
        data: employee
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not retrieve employee: ' + error.message,
        data: null
      };
    }
  },

  getLateEmployees: async (date, departmentId) => {
    try {
      // Set default date to today if not provided
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get start and end of current month for monthly late count
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

      // Define late time (e.g., 8:30 AM)
      const lateTime = new Date(targetDate);
      lateTime.setHours(8, 30, 0, 0);

      // Validate department if provided
      let departmentFilter = {};
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (department) {
          departmentFilter = { 'employee.department': departmentId };
        }
      }

      // Aggregate pipeline to get all check-ins for the day
      const checkins = await Checkin.aggregate([
        // Match check-ins for the target date
        {
          $match: {
            timestamp: {
              $gte: startOfDay,
              $lte: endOfDay
            },
            checkinStatus: 'check in'
          }
        },
        // Lookup employee information
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        // Unwind the employee array
        {
          $unwind: '$employee'
        },
        // Lookup department information
        {
          $lookup: {
            from: 'departments',
            localField: 'employee.department',
            foreignField: '_id',
            as: 'department'
          }
        },
        // Unwind the department array
        {
          $unwind: '$department'
        },
        // Lookup position information
        {
          $lookup: {
            from: 'positions',
            localField: 'employee.position',
            foreignField: '_id',
            as: 'position'
          }
        },
        // Unwind the position array
        {
          $unwind: '$position'
        },
        // Apply department filter if provided
        {
          $match: departmentFilter
        },
        // Get monthly late count for each employee
        {
          $lookup: {
            from: 'checkins',
            let: { employeeId: '$employeeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$employeeId'] },
                      { $gte: ['$timestamp', startOfMonth] },
                      { $lte: ['$timestamp', endOfMonth] },
                      { $gt: ['$timestamp', lateTime] }
                    ]
                  }
                }
              }
            ],
            as: 'monthlyLateCheckins'
          }
        },
        // Project the required fields
        {
          $project: {
            _id: 0,
            employeeId: '$employee.employeeId',
            fullName: '$employee.fullName',
            department: '$department.name',
            position: '$position.name',
            checkinTime: '$timestamp',
            isLate: {
              $gt: ['$timestamp', lateTime]
            },
            lateMinutes: {
              $cond: {
                if: { $gt: ['$timestamp', lateTime] },
                then: {
                  $divide: [
                    { $subtract: ['$timestamp', lateTime] },
                    60000 // Convert milliseconds to minutes
                  ]
                },
                else: 0
              }
            },
            monthlyLateCount: { $size: '$monthlyLateCheckins' }
          }
        },
        // Sort by check-in time
        {
          $sort: { checkinTime: 1 }
        }
      ]);

      return {
        status: 200,
        message: 'Check-ins retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          totalCheckins: checkins.length,
          lateCheckins: checkins.filter(c => c.isLate).length,
          checkins: checkins
        }
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not retrieve check-ins: ' + error.message,
        data: null
      };
    }
  },

  getEarlyLeaveEmployees: async (date, departmentId) => {
    try {
      // Set default date to today if not provided
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get start and end of current month for monthly early leave count
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

      // Define early leave time (e.g., 5:30 PM)
      const earlyLeaveTime = new Date(targetDate);
      earlyLeaveTime.setHours(17, 30, 0, 0);

      // Build match conditions
      const matchConditions = {
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        checkinStatus: 'check out'
      };

      // Only add department filter if departmentId is provided
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return {
            status: 200,
            message: 'Department not found',
            data: {
              date: targetDate.toISOString().split('T')[0],
              totalCheckouts: 0,
              earlyLeaves: 0,
              checkouts: []
            }
          };
        }
        matchConditions['employee.department'] = departmentId;
      }

      // Aggregate pipeline to get all check-outs for the day
      const checkouts = await Checkin.aggregate([
        // Match check-outs for the target date
        {
          $match: {
            timestamp: {
              $gte: startOfDay,
              $lte: endOfDay
            },
            checkinStatus: 'check out'
          }
        },
        // Lookup employee information
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        // Unwind the employee array
        {
          $unwind: '$employee'
        },
        // Lookup department information
        {
          $lookup: {
            from: 'departments',
            localField: 'employee.department',
            foreignField: '_id',
            as: 'department'
          }
        },
        // Unwind the department array with preserveNullAndEmptyArrays
        {
          $unwind: {
            path: '$department',
            preserveNullAndEmptyArrays: true
          }
        },
        // Lookup position information
        {
          $lookup: {
            from: 'positions',
            localField: 'employee.position',
            foreignField: '_id',
            as: 'position'
          }
        },
        // Unwind the position array with preserveNullAndEmptyArrays
        {
          $unwind: {
            path: '$position',
            preserveNullAndEmptyArrays: true
          }
        },
        // Apply department filter if provided
        {
          $match: matchConditions
        },
        // Get monthly early leave count for each employee
        {
          $lookup: {
            from: 'checkins',
            let: { employeeId: '$employeeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$employeeId'] },
                      { $gte: ['$timestamp', startOfMonth] },
                      { $lte: ['$timestamp', endOfMonth] },
                      { $lt: ['$timestamp', earlyLeaveTime] },
                      { $eq: ['$checkinStatus', 'check out'] }
                    ]
                  }
                }
              }
            ],
            as: 'monthlyEarlyLeaves'
          }
        },
        // Project the required fields
        {
          $project: {
            _id: 0,
            employeeId: '$employee.employeeId',
            fullName: '$employee.fullName',
            department: { $ifNull: ['$department.name', 'N/A'] },
            position: { $ifNull: ['$position.name', 'N/A'] },
            checkoutTime: '$timestamp',
            isEarlyLeave: {
              $lt: ['$timestamp', earlyLeaveTime]
            },
            earlyLeaveMinutes: {
              $cond: {
                if: { $lt: ['$timestamp', earlyLeaveTime] },
                then: {
                  $divide: [
                    { $subtract: [earlyLeaveTime, '$timestamp'] },
                    60000 // Convert milliseconds to minutes
                  ]
                },
                else: 0
              }
            },
            monthlyEarlyLeaveCount: { $size: '$monthlyEarlyLeaves' }
          }
        },
        // Sort by checkout time
        {
          $sort: { checkoutTime: 1 }
        }
      ]);

      return {
        status: 200,
        message: 'Check-outs retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          totalCheckouts: checkouts.length,
          earlyLeaves: checkouts.filter(c => c.isEarlyLeave).length,
          checkouts: checkouts
        }
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not retrieve check-outs: ' + error.message,
        data: null
      };
    }
  },

  updateEmployeeAvatar: async (employeeId, imageAvatar) => {
    try {
      const updatedEmployee = await Employee.findOneAndUpdate(
        { employeeId },
        { imageAvatar },
        { new: true }
      ).populate([
        { path: 'department', select: 'name' },
        { path: 'position', select: 'name' }
      ]);
      return updatedEmployee;
    } catch (error) {
      console.error('Error in updateEmployeeAvatar:', error);
      throw error;
    }
  },

  getEmployeesByDepartmentAndDate: async (departmentId, startDate, endDate) => {
    try {
      // Set end of day for endDate
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Convert dates to start of day for startDate
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);

      console.log('Start Date:', startOfDay);
      console.log('End Date:', endOfDay);

      // Build query conditions
      const query = {};

      // Add department filter if provided
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return {
            status: 404,
            message: 'Department not found',
            data: null
          };
        }
        query.department = departmentId;
      }

      console.log('Query conditions:', JSON.stringify(query, null, 2));

      // Get employees with populated department and position
      const allEmployees = await Employee.find(query)
        .populate('department', 'name')
        .populate('position', 'name')
        .sort({ registrationDate: -1 });

      // Filter employees by date range
      const employees = allEmployees.filter(emp => {
        const regDate = new Date(emp.registrationDate);
        return regDate >= startOfDay && regDate <= endOfDay;
      });

      console.log('Total employees before date filter:', allEmployees.length);
      console.log('Found employees after date filter:', employees.length);

      // Format response
      const formattedEmployees = employees.map(emp => ({
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department ? emp.department.name : 'N/A',
        position: emp.position ? emp.position.name : 'N/A',
        registrationDate: emp.registrationDate,
        status: emp.status,
        imageAvatar: emp.imageAvatar,
        faceImage: emp.faceImage,
        image34: emp.image34,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt
      }));

      return {
        totalEmployees: employees.length,
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        department: departmentId ? (await Department.findById(departmentId)).name : 'All Departments',
        employees: formattedEmployees
      };
    } catch (error) {
      console.error('Error in getEmployeesByDepartmentAndDate:', error);
      throw error;
    }
  }
};

module.exports = employeeService; 