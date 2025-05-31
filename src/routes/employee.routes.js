const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');

// POST /api/employees 
router.post('/', employeeController.registerEmployee);

// PUT /api/employees/:employeeId 
router.put('/:employeeId', employeeController.updateEmployee);

// DELETE /api/employees/:employeeId 
router.delete('/:employeeId', employeeController.deleteEmployee);

// GET /api/employees - Get all employees
router.get('/', employeeController.getAllEmployees);

// GET /api/employees/late - Get late employees
router.get('/late', employeeController.getLateEmployees);

// GET /api/employees/early - Get early leave employees
router.get('/early', employeeController.getEarlyLeaveEmployees);

// GET /api/employees/department - Get employees by department and date
router.get('/department', employeeController.getEmployeesByDepartmentAndDate);

module.exports = router;