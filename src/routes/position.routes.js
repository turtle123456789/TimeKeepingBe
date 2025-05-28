const express = require('express');
const router = express.Router();
const positionController = require('../controllers/position.controller');

// GET /api/positions 
router.get('/', positionController.getAllPositions);

// PUT /api/positions/:positionId 
router.put('/:positionId', positionController.updatePosition);

// DELETE /api/positions/:positionId 
router.delete('/:positionId', positionController.deletePosition);

// GET /api/positions/department/:departmentId - Get positions by department ID
router.get('/department/:departmentId', positionController.getPositionsByDepartment);

module.exports = router; 