const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');

// GET /api/departments -
router.get('/', departmentController.getAllDepartments);

// POST /api/departments -
router.post('/', departmentController.createDepartment);

// Update department
router.put('/:departmentId', departmentController.updateDepartment);

// Delete department
router.delete('/:departmentId', departmentController.deleteDepartment);

module.exports = router; 