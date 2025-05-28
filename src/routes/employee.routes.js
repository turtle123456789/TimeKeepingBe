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

module.exports = router; 