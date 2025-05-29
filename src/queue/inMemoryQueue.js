const EventEmitter = require('events');

class InMemoryQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false; 
  }

  enqueue(item) {
    this.queue.push(item);
    this.emit('newItem'); 
  }

  dequeue() {
    if (this.queue.length > 0) {
      
      return this.queue.shift();
    }
    return null;
  }

  async startWorker(processFunction) {
    if (this.processing) {
      console.log('Worker is already running.');
      return;
    }

    this.processing = true;
    console.log('In-memory queue worker started.');

    this.on('newItem', () => {
        setImmediate(() => this._processQueue(processFunction));
    });

    this._processQueue(processFunction);
  }

  async _processQueue(processFunction) {
      if (this.queue.length === 0 || !this.processing) {
          return;
      }

      const item = this.dequeue();
      if (item) {
          try {
              await processFunction(item);
              console.log('Item processed successfully.');
          } catch (error) {
              console.error('Error processing item:', error);
          }

          setImmediate(() => this._processQueue(processFunction));
      }
  }

  stopWorker() {
    this.processing = false;
    console.log('In-memory queue worker stopped.');
  }
}

const deviceEventQueue = new InMemoryQueue();

module.exports = deviceEventQueue; 