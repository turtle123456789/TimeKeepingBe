const mqtt = require('mqtt');
const config = require('../config/mqtt.config');

class MQTTService {
  constructor(io) {
    this.io = io;
    this.client = null;
  }

  connect() {
    const options = {
      keepalive: config.mqtt.keepalive,
      // Add authentication if credentials are provided
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

  handleMessage(topic, message) {
    try {
      // const data = {
      //   topic,
      //   message: message.toString(),
      //   timestamp: new Date().toISOString()
      // };
      
      // this.io.emit('mqtt-message', data);
      // console.log('Forwarded MQTT message:', data);
      console.log("received data ---> topic = ", topic, "message = ", message.toString());
    } catch (error) {
      console.error('Error processing MQTT message:', error);
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