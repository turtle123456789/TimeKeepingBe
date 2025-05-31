const express = require('express');
const router = express.Router();
const positionController = require('../controllers/position.controller');

// Create new position
router.post('/', positionController.createPosition);

// GET /api/positions 
router.get('/', positionController.getAllPositions);

// GET /api/positions/department/:departmentId 
router.get('/department/:departmentId', positionController.getPositionsByDepartment);

// PUT /api/positions/:positionId 
router.put('/:positionId', positionController.updatePosition);

// DELETE /api/positions/:positionId 
router.delete('/:positionId', positionController.deletePosition);

module.exports = router; 