const mqtt = require('mqtt');
const config = require('../config/mqtt.config');
const employeeController = require('../controllers/employee.controller'); // Import employeeController
const employeeService = require('../services/employee.service'); // Import employeeService

class MQTTService {
  constructor(io) {
    this.io = io; // Socket.IO instance
    this.client = null;
  }

  connect() {
    const options = {
      keepalive: config.mqtt.keepalive,
      ...(process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD && {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
      })
    };

    this.client = mqtt.connect(config.mqtt.url, options);

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');

      this.subscribe();
    });

    this.client.on('message', (topic, message) => this.handleMessage(topic, message));
    this.client.on('error', (error) => this.handleError(error));
  }

  subscribe() {
    this.client.subscribe(config.mqtt.topic, (err) => {
      if (err) {
        console.error('MQTT subscription error:', err);
      } else {
        console.log('Subscribed to MQTT topic:', config.mqtt.topic);
      }
    });
  }

  async handleMessage(topic, message) {
    try {
      const messageString = message.toString();
      // console.log("Received MQTT message ---> topic = ", topic, "message = ", messageString);

      const eventData = JSON.parse(messageString);
      console.log("evenData = ", eventData);

      const processedData = await employeeController.processDeviceEventData(eventData);
      processedData.status = "check-in"
      switch (processedData.status) {
        case 'đăng ký':
          employeeController.handleRegistrationSave(processedData)
            .then(result => console.log('MQTT: Employee registration handling called.', result))
            .catch(error => console.error('Error in employee registration handling:', error));
          break;
        case 'cập nhật':
          employeeController.handleUpdateSave(processedData)
            .then(result => console.log('MQTT: Employee update handling called.', result))
            .catch(error => console.error('Error in employee update handling:', error));
          break;
        case 'checkin':
          // Luồng 1 (Async): Lưu bản ghi check-in vào database
          employeeController.handleCheckinSave(processedData)
            .then(checkinRecord => console.log('Check-in record saved successfully:', checkinRecord))
            .catch(error => console.error('Error saving check-in record:', error));
          break;
        default:
          console.error('MQTT: Unexpected status after processing:', processedData.status);
      }
      // Luồng 2 (Async): Lấy thông tin employee và gửi lên frontend
      (async () => {
        try {
          // Sử dụng processedData.employeeId string để tìm employee
          const employee = await employeeService.getEmployeeByEmployeeIdString(processedData.employeeId);
          console.log("vaoooo ->>");
          if (employee) {
            const frontendData = {
              employeeId: employee.employeeId,
              fullName: employee.fullName,
              position: employee.position,
              department: employee.department,
              status: processedData.status,
              timestamp: processedData.timestamp
            };
            // Gửi thông tin lên frontend qua Socket.IO
            if (this.io) {
              this.io.emit('checkin', frontendData);
              console.log('Sent check-in data to frontend:', frontendData);
            } else {
              console.log('Socket.IO instance not available, cannot emit checkin data.');
            }

          } else {
            // console.log(`Employee with employeeId ${processedData.employeeId} not found for frontend update.`);
            // for testing 
            const frontendData = {
              employeeId: processedData.employeeId,
              fullName: processedData.employeeName,
              position: "test",
              department: "test",
              status: processedData.status,
              timestamp: processedData.timestamp,

            };
            // Gửi thông tin lên frontend qua Socket.IO
            if (this.io) {
              this.io.emit('checkin', frontendData);
              console.log('Sent check-in data to frontend:', frontendData);
            } else {
              console.log('Socket.IO instance not available, cannot emit checkin data.');
            }
          }
        } catch (error) {
          console.log('MQTT Service - Error in frontend emission flow:', error);
        }
      })();
    } catch (error) {
      console.error('MQTT Service - Error processing message (parsing or initial processing):', error);
    }
  }

  handleError(error) {
    console.error('MQTT Client Error:', error);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = MQTTService; 