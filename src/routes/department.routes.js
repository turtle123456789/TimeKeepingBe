const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');

// GET /api/departments -
router.get('/', departmentController.getAllDepartments);

// POST /api/departments -
router.post('/', departmentController.createDepartment);

// PUT /api/departments/:departmentId - 
router.put('/:departmentId', departmentController.updateDepartment);

// DELETE /api/departments/:departmentId - 
router.delete('/:departmentId', departmentController.deleteDepartment);

module.exports = router; 