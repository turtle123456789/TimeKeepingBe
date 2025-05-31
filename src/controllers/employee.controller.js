const employeeService = require('../services/employee.service');
const fs = require('fs');
const path = require('path');

const employeeController = {
  registerEmployee: async (req, res) => {
    try {
      const employeeData = req.body;

      // Validate required fields
      if (!employeeData.employeeId || !employeeData.fullName || !employeeData.email || !employeeData.phone) {
        return res.status(400).json({
          status: 400,
          message: 'Missing required fields: employeeId, fullName, email, and phone are required.',
          data: null
        });
      }

      // Validate email format
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(employeeData.email)) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid email format',
          data: null
        });
      }

      // Validate phone format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(employeeData.phone)) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid phone format. Must be 10 digits.',
          data: null
        });
      }

      // Check if employee already exists
      const existingEmployee = await employeeService.getEmployeeByEmployeeId(employeeData.employeeId);
      if (existingEmployee) {
        return res.status(409).json({
          status: 409,
          message: 'Employee with this ID already exists',
          data: null
        });
      }

      // Create new employee
      const newEmployee = await employeeService.createEmployee(employeeData);
      return res.status(201).json({
        status: 201,
        message: 'Employee registered successfully',
        data: newEmployee
      });
    } catch (error) {
      console.error('Error in registerEmployee:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  updateEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const updateData = req.body;

      // Validate email format if provided
      if (updateData.email) {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(updateData.email)) {
          return res.status(400).json({
            status: 400,
            message: 'Invalid email format',
            data: null
          });
        }
      }

      // Validate phone format if provided
      if (updateData.phone) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(updateData.phone)) {
          return res.status(400).json({
            status: 400,
            message: 'Invalid phone format. Must be 10 digits.',
            data: null
          });
        }
      }

      const updatedEmployee = await employeeService.updateEmployee(employeeId, updateData);
      if (!updatedEmployee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee updated successfully',
        data: updatedEmployee
      });
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  deleteEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const deletedEmployee = await employeeService.deleteEmployee(employeeId);
      
      if (!deletedEmployee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee deleted successfully',
        data: deletedEmployee
      });
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getAllEmployees: async (req, res) => {
    try {
      const employees = await employeeService.getAllEmployees();
      return res.status(200).json({
        status: 200,
        message: 'Employees retrieved successfully',
        data: employees
      });
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getEmployeeById: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const employee = await employeeService.getEmployeeByEmployeeId(employeeId);
      
      if (!employee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee retrieved successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error in getEmployeeById:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  // Hàm xử lý dữ liệu sự kiện từ thiết bị (tái sử dụng bởi worker và HTTP)
  processDeviceEventData: async (eventData) => {
    if (!eventData.deviceId || !eventData.employeeName || !eventData.employeeId || !eventData.timestamp || !eventData.faceBase64) {
      return {
        status: 400,
        message: 'Missing required fields.',
        data: null
      };
    }

    const { deviceId, employeeName, employeeId, timestamp, faceBase64 } = eventData;
    let imagePath = "";

    return {
      status: 200,
      data: { deviceId, employeeName, employeeId, timestamp, faceBase64, imagePath },
      message: 'Data processed successfully'
    };
  },

  handleCheckinSave: async (processedData) => {
    try {
      const faceIdForCheckin = processedData.faceBase64 || 'N/A';

      const checkinRecord = await employeeService.recordCheckin(
        processedData.deviceId,
        processedData.employeeId,
        processedData.timestamp,
        faceIdForCheckin,
        processedData.status || "check in"
      );
      console.log('Check-in record created:', checkinRecord);
      return {
        status: 201,
        data: checkinRecord,
        message: 'Check-in record created successfully'
      };
    } catch (error) {
      console.error('Error saving check-in record:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  handleRegistrationSave: async (registrationData) => {
    try {
      // Validate dữ liệu đăng ký
      if (!registrationData.employeeId || !registrationData.employeeName) {
        return {
          status: 400,
          message: 'Missing required fields: employeeId and employeeName are required',
          data: null
        };
      }

      // Kiểm tra nhân viên đã tồn tại
      const existingEmployee = await employeeService.getEmployeeByEmployeeIdString(registrationData.employeeId);
      if (existingEmployee) {
        return {
          status: 409,
          message: 'Employee already exists',
          data: null
        };
      }

      // Tạo nhân viên mới
      const newEmployee = await employeeService.createEmployee({
        employeeId: registrationData.employeeId,
        fullName: registrationData.employeeName,
        department: registrationData.department || "Chưa phân phòng ban",
        position: registrationData.position || "Chưa phân chức vụ",
        employeeType: registrationData.employeeType || "fulltime",
        registrationDate: registrationData.registrationDate,
        faceData: registrationData.faceData
      });

      console.log('New employee registered:', newEmployee);
      return {
        status: 201,
        data: newEmployee,
        message: 'Employee registered successfully'
      };
    } catch (error) {
      console.error('Error in handleRegistrationSave:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  handleUpdateSave: async (updateData) => {
    try {
      // Validate dữ liệu cập nhật
      if (!updateData.employeeId) {
        return {
          status: 400,
          message: 'Missing required field: employeeId',
          data: null
        };
      }

      // Tìm nhân viên cần cập nhật
      const existingEmployee = await employeeService.getEmployeeByEmployeeIdString(updateData.employeeId);
      if (!existingEmployee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      // Cập nhật thông tin
      const updatedEmployee = await employeeService.updateEmployee(updateData.employeeId, {
        fullName: updateData.fullName,
        department: updateData.department,
        position: updateData.position,
        employeeType: updateData.employeeType,
        faceData: updateData.faceData,
        updateDate: updateData.updateDate
      });

      console.log('Employee updated:', updatedEmployee);
      return {
        status: 200,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      };
    } catch (error) {
      console.error('Error in handleUpdateSave:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  },

  getLateEmployees: async (req, res) => {
    try {
      const date = req.query.date; 
      const departmentId = req.query.departmentId; 
      const result = await employeeService.getLateEmployees(date, departmentId);
      
      res.status(result.status).json({
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error in employeeController.getLateEmployees:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getEarlyLeaveEmployees: async (req, res) => {
    try {
      const date = req.query.date; 
      const departmentId = req.query.departmentId; 
      const result = await employeeService.getEarlyLeaveEmployees(date, departmentId);
      
      res.status(result.status).json({
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error in employeeController.getEarlyLeaveEmployees:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updateEmployeeAvatar: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { imageAvatar } = req.body;

      if (!imageAvatar) {
        return res.status(400).json({
          status: 400,
          message: 'Image avatar is required',
          data: null
        });
      }

      // Validate base64 image format
      if (!imageAvatar.startsWith('data:image/')) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid image format. Must be base64 encoded image',
          data: null
        });
      }

      const updatedEmployee = await employeeService.updateEmployeeAvatar(employeeId, imageAvatar);
      
      if (!updatedEmployee) {
        return res.status(404).json({
          status: 404,
          message: 'Employee not found',
          data: null
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Employee avatar updated successfully',
        data: updatedEmployee
      });
    } catch (error) {
      console.error('Error in updateEmployeeAvatar:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },

  getEmployeesByDepartmentAndDate: async (req, res) => {
    try {
      const { departmentId, date } = req.query;

      // Validate date format if provided
      let targetDate = new Date();
      if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({
            status: 400,
            message: 'Invalid date format. Please use YYYY-MM-DD format',
            data: null
          });
        }
      }

      // Set start date to 01/01/1977
      const startDate = new Date('1977-01-01');

      const result = await employeeService.getEmployeesByDepartmentAndDate(departmentId, startDate, targetDate);
      
      return res.status(200).json({
        status: 200,
        message: 'Employees retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in getEmployeesByDepartmentAndDate:', error);
      return res.status(500).json({
        status: 500,
        message: error.message,
        data: null
      });
    }
  },
};

module.exports = employeeController; 