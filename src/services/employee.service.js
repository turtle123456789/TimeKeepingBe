const Employee = require('../models/employee.model');
const Checkin = require('../models/checkin.model');
const Department = require('../models/department.model');
const Position = require('../models/position.model');
const { formatDateCustom, formatMinutesToHoursAndMinutes, calculateAverageTime } = require('../utils/date.utils');

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
      console.log("deviceID = ", deviceID);
      console.log("employeeIdString = ", employeeIdString);
      console.log("timestamp = ", timestamp);
      console.log("faceId = ", faceId);
      console.log("checkinStatus = ", checkinStatus);
      const newCheckin = new Checkin({
        deviceId: deviceID,
        employeeId: employeeIdString,
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
      console.log("employee = ", employee);

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
      // Set target date to today if not provided
      const targetDate = date ? new Date(date) : new Date();
      // Create date in UTC
      const utcDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate()
      ));

      console.log("Input targetDate: ", targetDate);
      console.log("Input targetDate Local: ", targetDate.getDate());
      console.log("Created UTC Date: ", utcDate);

      // Set start and end of the day in UTC
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));

      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      console.log("startOfDay: ", startOfDay);
      console.log("endOfDay: ", endOfDay);

      // Set start and end of the month in UTC
      const startOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        1,
        0, 0, 0, 0
      ));

      const endOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth() + 1,
        0,
        23, 59, 59, 999
      ));

      // Define early leave times for different shifts in UTC
      const morningShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        8, 0, 0, 0
      )); // 12:00 GMT+7

      const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        13, 0, 0, 0
      )); // 17:00 GMT+7

      const fullDayEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        8, 0, 0, 0
      )); // 17:00 GMT+7

      console.log("fullDayEarlyLeaveTime: ", fullDayEarlyLeaveTime);
      console.log("morningShiftEarlyLeaveTime: ", morningShiftEarlyLeaveTime);
      console.log("afternoonShiftEarlyLeaveTime: ", afternoonShiftEarlyLeaveTime);

      // Get employees based on department
      let employees;
      if (departmentId && departmentId !== 'all') {
        const department = await Department.findById(departmentId);
        if (!department) {
          return {
            status: 404,
            message: 'Department not found',
            data: null
          };
        }
        employees = await Employee.find({ department: departmentId })
          .populate('department', 'name')
          .populate('position', 'name');
      } else {
        employees = await Employee.find()
          .populate('department', 'name')
          .populate('position', 'name');
      }

      console.log("Total employees found:", employees.length);

      // Get all check-ins for the specified day
      const employeeIds = employees.map(emp => emp.employeeId);
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));
      console.log("Employee IDs to search:", employeeIds);

      // First, let's check what check-in records exist
      const allCheckins = await Checkin.find({
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ timestamp: 1 });

      console.log("allCheckins = ", allCheckins.length);
      const mapCountLate = new Map();
      const mapEmployeeCheckinsLate = new Map();

      allCheckins.forEach(checkin => {
        console.log("timestamp = ", checkin.timestamp);
        const date = formatDateCustom(checkin.timestamp)
        const key = `${checkin.employeeId}_${date}`;
        if (!mapEmployeeCheckinsLate.has(key)) {
          console.log("key = ", key);
          mapEmployeeCheckinsLate.set(key, []);
        }
        mapEmployeeCheckinsLate.get(key).push(checkin);
      });
      console.log("mapEmployeeCheckinsLate = ", mapEmployeeCheckinsLate);

      mapEmployeeCheckinsLate.forEach((checkins, key) => {
        const employeeId = key.split('_')[0];
        const date = key.split('_')[1];
        console.log("checkins = ", checkins.length);
        console.log("date = ", date);

        if (checkins.length > 1 || (checkins.length === 1 && date === formatDateCustom(new Date()))) {
          const checkinTime = checkins[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          console.log("shift = ", shift, " employeeId = ", employeeId);

          const morningLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )); // 12:00 GMT+7

          const afternoonLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            13, 0, 0, 0
          )); // 17:00 GMT+7

          const fullLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )); // 17:00 GMT+7
          if (shift === 'Cả ngày') {
            if (checkinTime > fullLateTime) {
              mapCountLate.set(employeeId, (mapCountLate.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningLateTime) {
              mapCountLate.set(employeeId, (mapCountLate.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonLateTime) {
              mapCountLate.set(employeeId, (mapCountLate.get(employeeId) || 0) + 1);
            }
          }
        }

      });
      console.log("mapCountLate: ", mapCountLate);

      const mapEmployeeLateToday = new Map();
      // muộn hôm nay
      employeeIds.forEach(employeeId => {
        const key = `${employeeId}_${formatDateCustom(targetDate)}`;
        console.log("key = ", key, "mapEmployeeCheckinsLate = ", mapEmployeeCheckinsLate.get(key));
        if (mapEmployeeCheckinsLate.has(key)) {
          const checkinsList = mapEmployeeCheckinsLate.get(key);
          const checkinTime = checkinsList[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          let isLate = false;
          let tmpCheckIn = null;
          console.log("checkinTime: ", checkinTime, "shift: ", shift, "startOfDay: ", startOfDay, "endOfDay: ", endOfDay);
          tmpCheckIn = checkinsList[0];
          if (shift === 'Cả ngày') {
            if (checkinTime > fullDayEarlyLeaveTime) {
              isLate = true;
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningShiftEarlyLeaveTime) {
              isLate = true;
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonShiftEarlyLeaveTime) {
              isLate = true;
            }
          }
          if (isLate) {
            mapEmployeeLateToday.set(employeeId, tmpCheckIn);
          }
        }
      });
      console.log("mapEmployeeLateToday: ", mapEmployeeLateToday);

      const employeeLateTodayList = Array.from(mapEmployeeLateToday.values())
        .map(checkin => {
          const employee = employeeMap.get(checkin.employeeId);
          const checkinTime = new Date(checkin.timestamp);
          const timePolicy = employee.shift === 'Cả ngày' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )) : employee.shift === 'Ca sáng' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            8, 0, 0, 0
          )) : new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getMonth(),
            checkinTime.getDate(), 13, 0, 0, 0));
          const lateMinutes = Math.round((checkinTime - timePolicy) / (1000 * 60));
          return {
            "Id": employee.employeeId,
            "employeeName": employee.fullName,
            "department": employee.department ? employee.department.name : 'N/A',
            "position": employee.position ? employee.position.name : 'N/A',
            "shift": employee.shift,
            "checkinTime": `${checkinTime.getUTCHours()}:${checkinTime.getUTCMinutes()}`,
            "lateMinutes": `${lateMinutes} phút`,
            "countLate": mapCountLate.get(checkin.employeeId) || 0
          };
        });

      return {
        status: 200,
        message: 'Late employees retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId && departmentId !== 'all' ? (await Department.findById(departmentId)).name : 'All Departments',
          totalEmployees: employees.length,
          lateEmployees: mapEmployeeLateToday.length,
          employees: employeeLateTodayList
        }
      };
    } catch (error) {
      console.error('Error in getLateEmployees:', error);
      return {
        status: 500,
        message: 'Could not retrieve late employees: ' + error.message,
        data: null
      };
    }
  },

  getEarlyLeaveEmployees: async (targetDate, departmentId) => {
    try {
      // Create date in UTC
      const utcDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate()
      ));

      console.log("Input targetDate: ", targetDate);
      console.log("Input targetDate Local: ", targetDate.getDate());
      console.log("Created UTC Date: ", utcDate);

      // Set start and end of the day in UTC
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));

      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      console.log("startOfDay: ", startOfDay);
      console.log("endOfDay: ", endOfDay);

      // Set start and end of the month in UTC
      const startOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        1,
        0, 0, 0, 0
      ));

      const endOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth() + 1,
        0,
        23, 59, 59, 999
      ));

      // Define early leave times for different shifts in UTC
      const morningShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        12, 0, 0, 0
      )); // 12:00 GMT+7

      const afternoonShiftEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 17:00 GMT+7

      const fullDayEarlyLeaveTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 17:00 GMT+7


      // Step 1: Get all employees by department
      let employees;
      if (departmentId && departmentId !== 'all') {
        const department = await Department.findById(departmentId);
        if (!department) {
          return {
            status: 404,
            message: 'Department not found',
            data: null
          };
        }
        employees = await Employee.find({ department: departmentId })
          .populate('department', 'name')
          .populate('position', 'name');
      } else {
        employees = await Employee.find()
          .populate('department', 'name')
          .populate('position', 'name');
      }

      console.log('Total employees found:', employees.length);

      // Step 2: Get all check-ins for these employees
      const employeeIds = employees.map(emp => emp.employeeId);
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      console.log("Employee IDs to search:", employeeIds);

      const allCheckins = await Checkin.find({
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ timestamp: -1 });

      console.log('Total check-ins found:', allCheckins.length);

      const mapEmployeeEarlyLeave = new Map();
      allCheckins.forEach(checkin => {
        console.log("timestamp = ", checkin.timestamp);
        const date = formatDateCustom(checkin.timestamp)
        const key = `${checkin.employeeId}_${date}`;
        if (!mapEmployeeEarlyLeave.has(key)) {
          console.log("key = ", key);
          mapEmployeeEarlyLeave.set(key, []);
        }
        mapEmployeeEarlyLeave.get(key).push(checkin);
      });
      console.log("mapEmployeeEarlyLeave = ", mapEmployeeEarlyLeave);

      // Create a map of employee data for easy lookup
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));

      // Create a map to store monthly early leave counts
      const mapCountEarlyLeave = new Map();

      mapEmployeeEarlyLeave.forEach((checkins, key) => {
        const employeeId = key.split('_')[0];
        const date = key.split('_')[1];
        console.log("checkins = ", checkins.length);
        console.log("date = ", date);

        if (checkins.length > 1 || (checkins.length === 1 && date === formatDateCustom(new Date()))) {
          const checkinTime = checkins[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          console.log("shift = ", shift, " employeeId = ", employeeId);

          const morningLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            12, 0, 0, 0
          )); // 12:00 GMT+7

          const afternoonLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )); // 17:00 GMT+7

          const fullLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )); // 17:00 GMT+7
          if (shift === 'Cả ngày') {
            if (checkinTime < fullLateTime) {
              mapCountEarlyLeave.set(employeeId, (mapCountEarlyLeave.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime < morningLateTime) {
              mapCountEarlyLeave.set(employeeId, (mapCountEarlyLeave.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime < afternoonLateTime) {
              mapCountEarlyLeave.set(employeeId, (mapCountEarlyLeave.get(employeeId) || 0) + 1);
            }
          }
        }

      });
      console.log("mapCountEarlyLeave: ", mapCountEarlyLeave);
      const mapEmployeeEarlyLeaveToday = new Map();
      employeeIds.forEach(employeeId => {
        const key = `${employeeId}_${formatDateCustom(targetDate)}`;
        console.log("key = ", key, "mapEmployeeCheckinsLate = ", mapEmployeeEarlyLeave.get(key));
        if (mapEmployeeEarlyLeave.has(key)) {
          const checkinsList = mapEmployeeEarlyLeave.get(key);
          const checkinTime = checkinsList[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          let isEarlyLeave = false;
          let tmpCheckIn = null;
          console.log("checkinTime: ", checkinTime, "shift: ", shift);
          tmpCheckIn = checkinsList[0];
          if (shift === 'Cả ngày') {
            if (checkinTime < fullDayEarlyLeaveTime) {
              isEarlyLeave = true;
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime < morningShiftEarlyLeaveTime) {
              isEarlyLeave = true;
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime < afternoonShiftEarlyLeaveTime) {
              isEarlyLeave = true;
            }
          }
          if (isEarlyLeave) {
            mapEmployeeEarlyLeaveToday.set(employeeId, tmpCheckIn);
          }
        }
      });
      console.log("mapEmployeeEarlyLeaveToday: ", mapEmployeeEarlyLeaveToday);

      const employeeEarlyLeaveTodayList = Array.from(mapEmployeeEarlyLeaveToday.values())
        .map(checkin => {
          const employee = employeeMap.get(checkin.employeeId);
          const checkinTime = new Date(checkin.timestamp);
          const timePolicy = employee.shift === 'Cả ngày' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )) : employee.shift === 'Ca sáng' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            12, 0, 0, 0
          )) : new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(), 17, 0, 0, 0));
          console.log("timePolicy: ", timePolicy);
          console.log("checkinTime: ", checkinTime);
          console.log("timePolicy - checkinTime: ", timePolicy - checkinTime);
          const earlyMinutes = Math.round((timePolicy - checkinTime) / (1000 * 60));
          return {
            "Id": employee.employeeId,
            "employeeName": employee.fullName,
            "department": employee.department ? employee.department.name : 'N/A',
            "position": employee.position ? employee.position.name : 'N/A',
            "shift": employee.shift,
            "checkinTime": `${checkinTime.getUTCHours()}:${checkinTime.getUTCMinutes()}`,
            "earlyMinutes": `${earlyMinutes} phút`,
            "countEarlyLeave": mapCountEarlyLeave.get(checkin.employeeId) || 0
          };
        });

      return {
        status: 200,
        message: 'Early leave check-outs retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId && departmentId !== 'all' ? (await Department.findById(departmentId)).name : 'All Departments',
          totalEmployees: employees.length,
          totalCheckins: allCheckins.length,
          earlyLeaves: employeeEarlyLeaveTodayList.length,
          employees: employeeEarlyLeaveTodayList
        }
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not retrieve early leave check-outs: ' + error.message,
        data: null
      };
    }
  },
  getOvertimeEmployees: async (targetDate, departmentId) => {
    try {
      // Create date in UTC
      const utcDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      ));

      console.log("Input targetDate: ", targetDate);
      console.log("Input targetDate Local: ", targetDate.getDate());
      console.log("Created UTC Date: ", utcDate);

      // Set start and end of the day in UTC
      const startOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        0, 0, 0, 0
      ));

      const endOfDay = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      console.log("startOfDay: ", startOfDay);
      console.log("endOfDay: ", endOfDay);

      // Set start and end of the month in UTC
      const startOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        1,
        0, 0, 0, 0
      ));

      const endOfMonth = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth() + 1,
        0,
        23, 59, 59, 999
      ));

      // Define shift end times in UTC
      const morningShiftEndTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        12, 0, 0, 0
      )); // 12:00 GMT+7

      const afternoonShiftEndTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 17:00 GMT+7

      const fullDayEndTime = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        17, 0, 0, 0
      )); // 17:00 GMT+7

      console.log("startOfMonth: ", startOfMonth);
      console.log("endOfMonth: ", endOfMonth);
      console.log("morningShiftEndTime: ", morningShiftEndTime);
      console.log("afternoonShiftEndTime: ", afternoonShiftEndTime);
      console.log("fullDayEndTime: ", fullDayEndTime);

      // Step 1: Get all employees by department
      let employees;
      if (departmentId && departmentId !== 'all') {
        const department = await Department.findById(departmentId);
        if (!department) {
          return {
            status: 404,
            message: 'Department not found',
            data: null
          };
        }
        employees = await Employee.find({ department: departmentId })
          .populate('department', 'name')
          .populate('position', 'name');
      } else {
        employees = await Employee.find()
          .populate('department', 'name')
          .populate('position', 'name');
      }

      console.log('Total employees found:', employees.length);

      // Step 2: Get all check-ins for these employees
      const employeeIds = employees.map(emp => emp.employeeId);
      console.log("Employee IDs to search:", employeeIds);
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));
      const employeeShiftMap = new Map(employees.map(emp => [emp.employeeId, emp.shift]));

      const allCheckins = await Checkin.find({
        employeeId: { $in: employeeIds },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }).sort({ timestamp: -1 });

      const mapEmployeeOvertime = new Map();
      allCheckins.forEach(checkin => {
        console.log("timestamp = ", checkin.timestamp);
        const date = formatDateCustom(checkin.timestamp)
        const key = `${checkin.employeeId}_${date}`;
        if (!mapEmployeeOvertime.has(key)) {
          console.log("key = ", key);
          mapEmployeeOvertime.set(key, []);
        }
        mapEmployeeOvertime.get(key).push(checkin);
      });
      console.log("mapEmployeeOvertime = ", mapEmployeeOvertime);


      const mapCountOvertime = new Map();

      mapEmployeeOvertime.forEach((checkins, key) => {
        const employeeId = key.split('_')[0];
        const date = key.split('_')[1];
        console.log("checkins = ", checkins.length);
        console.log("date = ", date);

        if (checkins.length > 1 || (checkins.length === 1 && date === formatDateCustom(new Date()))) {
          const checkinTime = checkins[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          // console.log("shift = ", shift, " employeeId = ", employeeId);

          const morningLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            12, 0, 0, 0
          )); // 12:00 GMT+7

          const afternoonLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )); // 17:00 GMT+7

          const fullLateTime = new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )); // 17:00 GMT+7
          if (shift === 'Cả ngày') {
            if (checkinTime > fullLateTime) {
              mapCountOvertime.set(employeeId, (mapCountOvertime.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningLateTime) {
              mapCountOvertime.set(employeeId, (mapCountOvertime.get(employeeId) || 0) + 1);
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonLateTime) {
              mapCountOvertime.set(employeeId, (mapCountOvertime.get(employeeId) || 0) + 1);
            }
          }
        }

      });
      console.log("mapCountOvertime: ", mapCountOvertime);

      // Thừa giờ hôm nay
      const mapEmployeeOvertimeToday = new Map();
      // employeeIds.forEach(employeeId => {
      //   if (mapEmployeeCheckins.has(employeeId)) {
      //     const checkinsList = mapEmployeeCheckins.get(employeeId);
      //     var isOvertime = false;
      //     var tmpCheckIn = null;
      //     for (let i = 0; i < checkinsList.length - 1; i += 2) {
      //       const checkin = checkinsList[i];
      //       const checkinTime = new Date(checkin.timestamp);
      //       const shift = employeeShiftMap.get(employeeId);
      //       console.log("checkinTime: ", checkinTime, "shift: ", shift, "startOfDay: ", startOfDay, "endOfDay: ", endOfDay);
      //       if (checkinTime >= startOfDay && checkinTime <= endOfDay) {
      //         tmpCheckIn = checkin;
      //         if (shift === 'Cả ngày') {
      //           if (checkinTime > fullDayEndTime) {
      //             isOvertime = true;
      //           }
      //         } else if (shift === 'Ca sáng') {
      //           if (checkinTime > morningShiftEndTime) {
      //             isOvertime = true;
      //           }
      //         } else if (shift === 'Ca chiều') {
      //           if (checkinTime > afternoonShiftEndTime) {
      //             isOvertime = true;
      //           }
      //         }
      //         break;
      //       }
      //     }
      //     if (isOvertime) {
      //       mapEmployeeOvertimeToday.set(employeeId, tmpCheckIn);
      //     }
      //   }
      // });

      employeeIds.forEach(employeeId => {
        const key = `${employeeId}_${formatDateCustom(targetDate)}`;
        console.log("key = ", key, "mapEmployeeOvertime = ", mapEmployeeOvertime.get(key));
        if (mapEmployeeOvertime.has(key)) {
          const checkinsList = mapEmployeeOvertime.get(key);
          const checkinTime = checkinsList[0].timestamp;
          const shift = employeeShiftMap.get(employeeId);
          let isOvertime = false;
          let tmpCheckIn = null;
          // console.log("checkinTime: ", checkinTime, "shift: ", shift);
          tmpCheckIn = checkinsList[0];
          if (shift === 'Cả ngày') {
            if (checkinTime > fullDayEndTime) {
              isOvertime = true;
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningShiftEndTime) {
              isOvertime = true;
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonShiftEndTime) {
              isOvertime = true;
            }
          }
          if (isOvertime) {
            mapEmployeeOvertimeToday.set(employeeId, tmpCheckIn);
          }
        }
      });

      const employeeOvertimeTodayList = Array.from(mapEmployeeOvertimeToday.values())
        .map(checkin => {
          const employee = employeeMap.get(checkin.employeeId);
          const checkinTime = new Date(checkin.timestamp);
          const timePolicy = employee.shift === 'Cả ngày' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            17, 0, 0, 0
          )) : employee.shift === 'Ca sáng' ? new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(),
            12, 0, 0, 0
          )) : new Date(Date.UTC(
            checkinTime.getFullYear(),
            checkinTime.getUTCMonth(),
            checkinTime.getUTCDate(), 17, 0, 0, 0));

          const overtimeMinutes = Math.round((checkinTime - timePolicy) / (1000 * 60));
          return {
            "Id": employee.employeeId,
            "employeeName": employee.fullName,
            "department": employee.department ? employee.department.name : 'N/A',
            "position": employee.position ? employee.position.name : 'N/A',
            "shift": employee.shift,
            "checkinTime": `${checkinTime.getUTCHours()}:${checkinTime.getUTCMinutes()}`,
            "overtimeMinutes": formatMinutesToHoursAndMinutes(overtimeMinutes),
            "countOvertime": mapCountOvertime.get(checkin.employeeId) || 0
          };
        });

      console.log("employeeOvertimeTodayList: ", employeeOvertimeTodayList);

      return {
        status: 200,
        message: 'Overtime check-outs retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId && departmentId !== 'all' ? (await Department.findById(departmentId)).name : 'All Departments',
          totalEmployees: employees.length,
          totalCheckins: allCheckins.length,
          overtimeEmployees: employeeOvertimeTodayList.length,
          employees: employeeOvertimeTodayList
        }
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Could not retrieve overtime check-outs: ' + error.message,
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
  },


  createTestCheckin: async (employeeId, checkinStatus, timestamp) => {
    try {
      // Find employee
      const employee = await Employee.findOne({ employeeId })
        .populate('department', 'name')
        .populate('position', 'name');

      if (!employee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      // Create check-in record
      const newCheckin = new Checkin({
        deviceId: 'TEST_DEVICE',
        employeeId: employee._id,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        faceId: 'TEST_FACE_ID',
        checkinStatus: checkinStatus
      });

      await newCheckin.save();

      // Format response
      const response = {
        status: 201,
        message: 'Test check-in created successfully',
        data: {
          ID: employee.employeeId,
          Employee: employee.fullName,
          Department: employee.department ? employee.department.name : 'N/A',
          Position: employee.position ? employee.position.name : 'N/A',
          Shift: employee.shift,
          Status: checkinStatus,
          Timestamp: newCheckin.timestamp.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
        }
      };

      return response;
    } catch (error) {
      return {
        status: 500,
        message: 'Could not create test check-in: ' + error.message,
        data: null
      };
    }
  },

  getMonthlyStatistics: async (employeeId, year, month) => {
    try {
      // Get employee information
      const employee = await Employee.findOne({ employeeId })
        .populate('department', 'name')
        .populate('position', 'name');

      if (!employee) {
        return {
          status: 404,
          message: 'Employee not found',
          data: null
        };
      }

      // Calculate start and end dates for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      // Get all check-ins for the month
      const checkins = await Checkin.find({
        employeeId,
      }).sort({ timestamp: 1 });
      // console.log("checkins = ", checkins);
      // Initialize statistics
      let checkinsInMonth = [];
      const countLateMap = new Map();
      checkins.forEach(checkin => {
        
        if (checkin.timestamp && checkin.timestamp.getUTCMonth() === month - 1 && checkin.timestamp.getUTCFullYear() === year) {
          checkinsInMonth.push(checkin);
          const key = `${checkin.employeeId}_${formatDateCustom(checkin.timestamp)}`;
          if (!countLateMap.has(key)) {
            countLateMap.set(key, []);
          }
          countLateMap.get(key).push(checkin);
        }
      });
      console.log("checkinsInMonth = ", checkinsInMonth);
      const stats = {
        workingDays: 0,
        totalWorkingHours: 0,
        overtimeHours: 0,
        lateDays: 0,
        absentDays: 0,
        averageCheckinTime: null,
        averageCheckoutTime: null,
        attendanceRate: 0
      };

      // Calculate working days and other metrics
      const workingDaysSet = new Set();
      const totalWorkingHoursMap = new Map();
      const overtimeHoursMap = new Map();   
      const lateDaysMap = new Map();
      const absentDaysMap = new Map();
      let checkinTimes = [];
      let checkoutTimes = [];

      checkinsInMonth.forEach(checkin => {
        const key = `${checkin.employeeId}_${formatDateCustom(checkin.timestamp)}`;
        console.log("key = ", key);
        if (countLateMap.has(key)) {
          const checkins = countLateMap.get(key);
          if (checkins.length > 1) {
            // Get check-in and check-out times
            const checkinTime = new Date(checkins[0].timestamp);
            const checkoutTime = new Date(checkins[1].timestamp);
            
            // Add to check-in/out time arrays for average calculation
            checkinTimes.push(checkinTime);
            checkoutTimes.push(checkoutTime);

            // Calculate working hours for this day
            const diffInMilliseconds = checkoutTime - checkinTime;
            console.log("diffInMilliseconds = ", diffInMilliseconds);
            const diffInHours = diffInMilliseconds / (1000 * 60 * 60); // convert to hours
            totalWorkingHoursMap.set(key, diffInHours);

            workingDaysSet.add(formatDateCustom(checkinTime));

            // Calculate overtime based on shift
            const shift = employee.shift;
            let standardEndTime;

            if (shift === 'Cả ngày') {
              standardEndTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                17, 0, 0, 0
              )); // 17:00 GMT+7
            } else if (shift === 'Ca sáng') {
              standardEndTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                12, 0, 0, 0
              )); // 12:00 GMT+7
            } else if (shift === 'Ca chiều') {
              standardEndTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                17, 0, 0, 0
              )); // 17:00 GMT+7
            }

            // Calculate overtime if checkout is after standard end time
            if (checkoutTime > standardEndTime) {
              const overtimeMilliseconds = checkoutTime - standardEndTime;
              const overtimeHoursForDay = overtimeMilliseconds / (1000 * 60 * 60);
              overtimeHoursMap.set(key, overtimeHoursForDay);
            }

            // Check for late arrival
            let standardStartTime;
            if (shift === 'Cả ngày' || shift === 'Ca sáng') {
              standardStartTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                8, 0, 0, 0
              )); // 8:00 GMT+7
            } else if (shift === 'Ca chiều') {
              standardStartTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                13, 0, 0, 0
              )); // 13:00 GMT+7
            }
            console.log("checkinTime = ", checkinTime, "standardStartTime = ", standardStartTime);
            if (checkinTime > standardStartTime) {
              lateDaysMap.set(key, checkinTime);
            }
          } else {
            absentDaysMap.set(key, checkinTime);
          }
        }
      });

      let totalWorkingHours = 0;
      let overtimeHours = 0;
      // Round the hours to 2 decimal places
      totalWorkingHoursMap.forEach((value, key) => {
        totalWorkingHours += value;
      });
      overtimeHoursMap.forEach((value, key) => {
        overtimeHours += value;
      });

      const averageCheckinTime = calculateAverageTime(checkinTimes);
      const averageCheckoutTime = calculateAverageTime(checkoutTimes);

      // Calculate total working days in the month
      const totalDaysInMonth = new Date(year, month, 0).getDate();
      console.log("totalDaysInMonth = ", totalDaysInMonth);
      // Calculate attendance rate
      const attendanceRate = (stats.workingDays / totalDaysInMonth) * 100;
      console.log("attendanceRate = ", attendanceRate);

      stats.lateDays = lateDaysMap.size;
      stats.absentDays = absentDaysMap.size;
      stats.workingDays = workingDaysSet.size;
      stats.totalWorkingHours = totalWorkingHours;
      stats.overtimeHours = overtimeHours;
      stats.averageCheckinTime = averageCheckinTime;
      stats.averageCheckoutTime = averageCheckoutTime;
      stats.attendanceRate = attendanceRate;

      return {
        status: 200,
        message: 'Monthly statistics retrieved successfully',
        data: {
          employee: {
            employeeId: employee.employeeId,
            fullName: employee.fullName,
            department: employee.department ? employee.department.name : 'N/A',
            position: employee.position ? employee.position.name : 'N/A'
          },
          month: month,
          year: year,
          statistics: stats
        }
      };
    } catch (error) {
      console.error('Error in getMonthlyStatistics:', error);
      return {
        status: 500,
        message: error.message,
        data: null
      };
    }
  }
};

module.exports = employeeService; 