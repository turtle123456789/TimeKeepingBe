const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 */
router.get('/', employeeController.getAllEmployees);


/**
 * @swagger
 * /api/employees/late:
 *   get:
 *     summary: Get late employees
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of late employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 department:
 *                   type: string
 *                 totalEmployees:
 *                   type: number
 *                 lateEmployees:
 *                   type: number
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: string
 *                       employeeName:
 *                         type: string
 *                       department:
 *                         type: string
 *                       position:
 *                         type: string
 *                       shift:
 *                         type: string
 *                       checkinTime:
 *                         type: string
 *                       lateMinutes:
 *                         type: string
 *                       countLate:
 *                         type: number
 */
router.get('/late', employeeController.getLateEmployees);

/**
 * @swagger
 * /api/employees/early-leave:
 *   get:
 *     summary: Get early leave employees
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of early leave employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 department:
 *                   type: string
 *                 totalEmployees:
 *                   type: number
 *                 earlyLeaves:
 *                   type: number
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: string
 *                       employeeName:
 *                         type: string
 *                       department:
 *                         type: string
 *                       position:
 *                         type: string
 *                       shift:
 *                         type: string
 *                       checkinTime:
 *                         type: string
 *                       earlyMinutes:
 *                         type: string
 *                       countEarlyLeave:
 *                         type: number
 */
router.get('/early-leave', employeeController.getEarlyLeaveEmployees);

/**
 * @swagger
 * /api/employees/overtime:
 *   get:
 *     summary: Get overtime employees
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of overtime employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 department:
 *                   type: string
 *                 totalEmployees:
 *                   type: number
 *                 overtimeEmployees:
 *                   type: number
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: string
 *                       employeeName:
 *                         type: string
 *                       department:
 *                         type: string
 *                       position:
 *                         type: string
 *                       shift:
 *                         type: string
 *                       checkinTime:
 *                         type: string
 *                       overtimeMinutes:
 *                         type: string
 *                       countOvertime:
 *                         type: number
 */
router.get('/overtime', employeeController.getOvertimeEmployees);

/**
 * @swagger
 * /api/employees/department-date:
 *   get:
 *     summary: Get employees by department and date range
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of employees in date range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEmployees:
 *                   type: number
 *                 dateRange:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 department:
 *                   type: string
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 */
router.get('/department-date', employeeController.getEmployeesByDepartmentAndDate);

/**
 * @swagger
 * /api/employees/test-checkin:
 *   post:
 *     summary: Create test check-in
 *     tags: [Check-ins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *               checkinStatus:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Test check-in created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     ID:
 *                       type: string
 *                     Employee:
 *                       type: string
 *                     Department:
 *                       type: string
 *                     Position:
 *                       type: string
 *                     Shift:
 *                       type: string
 *                     Status:
 *                       type: string
 *                     Timestamp:
 *                       type: string
 */
router.post('/test-checkin', employeeController.createTestCheckin);


/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 */
router.post('/', employeeController.registerEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */
router.put('/:employeeId', employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{employeeId}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 */
router.delete('/:employeeId', employeeController.deleteEmployee);

/**
 * @swagger
 * /api/employees/avatar/{employeeId}:
 *   put:
 *     summary: Update employee avatar
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageAvatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 */
router.put('/avatar/:employeeId', employeeController.updateEmployeeAvatar);

module.exports = router; 