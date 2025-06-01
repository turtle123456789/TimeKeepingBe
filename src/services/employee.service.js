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
      if (departmentId) {
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
      const employeeShiftMap= new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp])); 
      console.log("Employee IDs to search:", employeeIds);

      // First, let's check what check-in records exist
      const allCheckins = await Checkin.find({
        employeeId: { $in: employeeIds }
      }).sort({ timestamp: 1 }) ;

      const mapEmployeeCheckins = new Map();
      const mapCountLate = new Map();
      allCheckins.forEach(checkin => {
        if (!mapEmployeeCheckins.has(checkin.employeeId)) {
          mapEmployeeCheckins.set(checkin.employeeId, []);
        }
        mapEmployeeCheckins.get(checkin.employeeId).push(checkin);
      });
  
      // tổng số buổi muộn
      mapEmployeeCheckins.forEach((checkins, employeeId) => {
        let countLate = 0;
        for(let i = 0; i < checkins.length - 1; i+=2) {
          const checkin = checkins[i];
          const checkinTime = new Date(checkin.timestamp);
          const shift = employeeShiftMap.get(employeeId);
          console.log("checkinTime: ", checkinTime , "shift: ", shift, "fullDayEarlyLeaveTime: ", fullDayEarlyLeaveTime);
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
              countLate++;
            }
          } else if (shift === 'Ca sáng') {
            if (checkinTime > morningLateTime) {
              countLate++;
            }
          } else if (shift === 'Ca chiều') {
            if (checkinTime > afternoonLateTime) {
              countLate++;
            }
          }
        }
        mapCountLate.set(employeeId, countLate);
      });

      console.log("mapCountLate: ", mapCountLate);

      const mapEmployeeLateToday = new Map();
      // muộn hôm nay
      employeeIds.forEach(employeeId => {
        if (mapEmployeeCheckins.has(employeeId)) {
            const checkinsList = mapEmployeeCheckins.get(employeeId);
            var isLate = false;
            var tmpCheckIn = null;
            for(let i = 0; i < checkinsList.length - 1; i+=2) {
              const checkin = checkinsList[i];
              const checkinTime = new Date(checkin.timestamp);     
              const shift = employeeShiftMap.get(employeeId); 
              console.log("checkinTime: ", checkinTime , "shift: ", shift, "startOfDay: ", startOfDay, "endOfDay: ", endOfDay);
              if(checkinTime >= startOfDay && checkinTime <= endOfDay) {
                tmpCheckIn = checkin;
                if(shift === 'Cả ngày') {
                  if(checkinTime > fullDayEarlyLeaveTime) {
                    isLate = true;
                  }
                } else if (shift === 'Ca sáng') {
                  if(checkinTime > morningShiftEarlyLeaveTime) {
                    isLate = true;
                  }
                } else if (shift === 'Ca chiều') {
                  if(checkinTime > afternoonShiftEarlyLeaveTime) {
                    isLate = true;
                  }
                }
                break;
              }
            }
            if(isLate) {
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
        )) : employee.shift === 'Ca sáng' ?  new Date(Date.UTC(
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
          "checkinTime": checkinTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit',   
            minute: '2-digit',
            hour12: false 
          }),
          "lateMinutes": `${lateMinutes} phút`,
          "countLate": mapCountLate.get(checkin.employeeId) || 0
        };
      });

      return {
        status: 200,
        message: 'Late employees retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId ? (await Department.findById(departmentId)).name : 'All Departments',
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
      if (departmentId) {
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
      const employeeShiftMap= new Map(employees.map(emp => [emp.employeeId, emp.shift]));
      console.log("Employee IDs to search:", employeeIds);

      const allCheckins = await Checkin.find({
        employeeId: { $in: employeeIds }
      }).sort({ timestamp: -1 });

      console.log('Total check-ins found:', allCheckins.length);

      const mapEmployeeCheckins = new Map();
      allCheckins.forEach(checkin => {
        if (!mapEmployeeCheckins.has(checkin.employeeId)) {
          mapEmployeeCheckins.set(checkin.employeeId, []);
        }
        mapEmployeeCheckins.get(checkin.employeeId).push(checkin);
      });
  
      // Create a map of employee data for easy lookup
      const employeeMap = new Map(employees.map(emp => [emp.employeeId, emp]));

      // Create a map to store monthly early leave counts
      const mapCountEarlyLeave = new Map();

      // Tông sớm cả tháng 
      employeeIds.forEach(employeeId => {
        if (mapEmployeeCheckins.has(employeeId)) {
          const checkinsList = mapEmployeeCheckins.get(employeeId);
          let countEarlyLeave = 0;
          for(let i = 0; i < checkinsList.length - 1; i+=2) {
              const checkin = checkinsList[i];
              const checkinTime = new Date(checkin.timestamp);
              const shift = employeeShiftMap.get(employeeId);
              console.log("checkinTime: ", checkinTime , "shift: ", shift, "fullDayEarlyLeaveTime: ", fullDayEarlyLeaveTime);
              const morningLateTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                12, 0, 0, 0
              )); 
        
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
                  countEarlyLeave++;
                }
              } else if (shift === 'Ca sáng') {
                if (checkinTime < morningLateTime) {
                  countEarlyLeave++;
                }
              } else if (shift === 'Ca chiều') {
                if (checkinTime < afternoonLateTime) {
                  countEarlyLeave++;
                }
              }
            }
            mapCountEarlyLeave.set(employeeId, countEarlyLeave);
          }
      });
      console.log("mapCountEarlyLeave: ", mapCountEarlyLeave);
      
      // Sớm hôm nay
      const mapEmployeeEarlyLeaveToday = new Map();
      employeeIds.forEach(employeeId => {
        if (mapEmployeeCheckins.has(employeeId)) {
          const checkinsList = mapEmployeeCheckins.get(employeeId);
          var isEarlyLeave = false;
          var tmpCheckIn = null;
          for(let i = 0; i < checkinsList.length - 1; i+=2) {
            const checkin = checkinsList[i];
            const checkinTime = new Date(checkin.timestamp);     
            const shift = employeeShiftMap.get(employeeId); 
            console.log("checkinTime: ", checkinTime , "shift: ", shift, "startOfDay: ", startOfDay, "endOfDay: ", endOfDay);
            if(checkinTime >= startOfDay && checkinTime <= endOfDay) {
              tmpCheckIn = checkin;
              if(shift === 'Cả ngày') {
                if(checkinTime < fullDayEarlyLeaveTime) {
                  isEarlyLeave = true;
                }
              } else if (shift === 'Ca sáng') {
                if(checkinTime < morningShiftEarlyLeaveTime) {
                  isEarlyLeave = true;
                }
              } else if (shift === 'Ca chiều') {
                if(checkinTime < afternoonShiftEarlyLeaveTime) {
                  isEarlyLeave = true;    
                }
              }
              break;
            }
          }
          if(isEarlyLeave) {
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
        )) : employee.shift === 'Ca sáng' ?  new Date(Date.UTC(
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
          "checkinTime": checkinTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit',   
            minute: '2-digit',
            hour12: false 
          }),
          "earlyMinutes": `${earlyMinutes} phút`,
          "countEarlyLeave": mapCountEarlyLeave.get(checkin.employeeId) || 0
        };
      });

      return {
        status: 200,
        message: 'Early leave check-outs retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId ? (await Department.findById(departmentId)).name : 'All Departments',
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
      if (departmentId) {
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
      const employeeShiftMap= new Map(employees.map(emp => [emp.employeeId, emp.shift]));

      const allCheckins = await Checkin.find({
        employeeId: { $in: employeeIds }
      }).sort({ timestamp: -1 });

      const mapEmployeeCheckins = new Map();
      allCheckins.forEach(checkin => {
        if (!mapEmployeeCheckins.has(checkin.employeeId)) {
          mapEmployeeCheckins.set(checkin.employeeId, []);
        }
        mapEmployeeCheckins.get(checkin.employeeId).push(checkin);
      });

      const mapCountOvertime = new Map();
      // Tông thừa giờ cả tháng
      employeeIds.forEach(employeeId => {
        if (mapEmployeeCheckins.has(employeeId)) {
          const checkinsList = mapEmployeeCheckins.get(employeeId);
          let countOvertime = 0;
          for(let i = 0; i < checkinsList.length - 1; i+=2) {
              const checkin = checkinsList[i];
              const checkinTime = new Date(checkin.timestamp);
              const shift = employeeShiftMap.get(employeeId);
              console.log("checkinTime: ", checkin.timestamp, ' = ', checkin.timestamp.getMonth(),' / ', checkin.timestamp.getDate(), "shift: ", shift);
              
              const morningLateTime = new Date(Date.UTC(
                checkinTime.getFullYear(),
                checkinTime.getUTCMonth(),
                checkinTime.getUTCDate(),
                12, 0, 0, 0
              )); 
        
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

              console.log("checkinTime: ", checkinTime, "fullLateTime: ", fullLateTime);
              console.log("checkinTime - fullLateTime: ", checkinTime - fullLateTime);
              
              if (shift === 'Cả ngày') {
                if (checkinTime > fullLateTime) {
                  countOvertime += (checkinTime - fullLateTime) / (1000 * 60);
                }
              } else if (shift === 'Ca sáng') {
                if (checkinTime > morningLateTime) {
                  countOvertime += (checkinTime - morningLateTime) / (1000 * 60);
                }
              } else if (shift === 'Ca chiều') {
                if (checkinTime > afternoonLateTime) {
                  countOvertime += (checkinTime - afternoonLateTime) / (1000 * 60);
                }
              }
            }
            mapCountOvertime.set(employeeId, countOvertime);
        }
      });
      console.log("mapCountOvertime: ", mapCountOvertime);

      // Thừa giờ hôm nay
      const mapEmployeeOvertimeToday = new Map();
      employeeIds.forEach(employeeId => {
        if (mapEmployeeCheckins.has(employeeId)) {
          const checkinsList = mapEmployeeCheckins.get(employeeId);
          var isOvertime = false;
          var tmpCheckIn = null;
          for(let i = 0; i < checkinsList.length - 1; i+=2) {
            const checkin = checkinsList[i];
            const checkinTime = new Date(checkin.timestamp);     
            const shift = employeeShiftMap.get(employeeId); 
            console.log("checkinTime: ", checkinTime , "shift: ", shift, "startOfDay: ", startOfDay, "endOfDay: ", endOfDay);
            if(checkinTime >= startOfDay && checkinTime <= endOfDay) {
              tmpCheckIn = checkin;
              if(shift === 'Cả ngày') {
                if(checkinTime > fullDayEndTime) {
                  isOvertime = true;
                }
              } else if (shift === 'Ca sáng') {
                if(checkinTime > morningShiftEndTime) {
                  isOvertime = true;
                }
              } else if (shift === 'Ca chiều') {
                if(checkinTime > afternoonShiftEndTime) {
                  isOvertime = true;    
                }
              }
              break;
            }
          }
          if(isOvertime) {
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
          "checkinTime": checkinTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit',   
            minute: '2-digit',
            hour12: false 
          }),
          "overtimeMinutes": `${overtimeMinutes} phút`,
          "countOvertime": mapCountOvertime.get(checkin.employeeId) || 0
        };
      });

      console.log("employeeOvertimeTodayList: ", employeeOvertimeTodayList);

      return {
        status: 200,
        message: 'Overtime check-outs retrieved successfully',
        data: {
          date: targetDate.toISOString().split('T')[0],
          department: departmentId ? (await Department.findById(departmentId)).name : 'All Departments',
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
  }
};

module.exports = employeeService; 