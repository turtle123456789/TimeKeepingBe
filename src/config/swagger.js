const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Time Keeping API',
      version: '1.0.0',
      description: 'API documentation for Time Keeping System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        // Request schemas (for POST/PUT)
        EmployeeRequest: {
          type: 'object',
          properties: {
            employeeId: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' },
            shift: { type: 'string', enum: ['Cả ngày', 'Ca sáng', 'Ca chiều'] },
            status: { type: 'string' },
            imageAvatar: { type: 'string' },
            faceImage: { type: 'string' },
            image34: { type: 'string' }
          },
          required: ['employeeId', 'fullName', 'department', 'position', 'shift']
        },
        CheckinRequest: {
          type: 'object',
          properties: {
            deviceId: { type: 'string' },
            employeeId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            faceId: { type: 'string' },
            checkinStatus: { type: 'string' }
          },
          required: ['employeeId', 'timestamp', 'checkinStatus']
        },
        DepartmentRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          required: ['name']
        },
        PositionRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            department: { type: 'string' }
          },
          required: ['name', 'department']
        },

        // Response schemas (for GET)
        Employee: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            employeeId: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' },
            shift: { type: 'string', enum: ['Cả ngày', 'Ca sáng', 'Ca chiều'] },
            status: { type: 'string' },
            imageAvatar: { type: 'string' },
            faceImage: { type: 'string' },
            image34: { type: 'string' }
          }
        },
        Checkin: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            deviceId: { type: 'string' },
            employeeId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            faceId: { type: 'string' },
            checkinStatus: { type: 'string' }
          }
        },
        Department: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            name: { type: 'string' }
          }
        },
        Position: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            name: { type: 'string' },
            department: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 