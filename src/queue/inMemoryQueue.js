const EventEmitter = require('events');

class InMemoryQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false; // Flag to prevent multiple workers processing concurrently
  }

  enqueue(item) {
    this.queue.push(item);
    this.emit('newItem'); // Signal that a new item is available
  }

  dequeue() {
    if (this.queue.length > 0) {
      // Use shift() to remove and return the first item (FIFO)
      return this.queue.shift();
    }
    return null;
  }

  // Simple worker function to process items from the queue one by one
  async startWorker(processFunction) {
    if (this.processing) {
      console.log('Worker is already running.');
      return;
    }

    this.processing = true;
    console.log('In-memory queue worker started.');

    // Listen for new items being added to the queue
    this.on('newItem', () => {
        // Use setImmediate to process the queue, allowing other events to be handled
        setImmediate(() => this._processQueue(processFunction));
    });

    // Also process any items already in the queue when starting
    this._processQueue(processFunction);
  }

  async _processQueue(processFunction) {
      if (this.queue.length === 0 || !this.processing) {
          // Queue is empty or processing is stopped
          return;
      }

      const item = this.dequeue();
      if (item) {
          try {
              // Execute the provided processing function for the item
              await processFunction(item);
              console.log('Item processed successfully.');
          } catch (error) {
              console.error('Error processing item:', error);
              // In a real scenario, you might log this error, try again, or move to a dead-letter queue
          }

          // Process the next item after the current one is done
          // Use setImmediate to avoid blocking the event loop for too long
          setImmediate(() => this._processQueue(processFunction));
      }
  }

  stopWorker() {
    this.processing = false;
    console.log('In-memory queue worker stopped.');
    // In a more robust implementation, you'd want to wait for current items to finish
  }
}

const deviceEventQueue = new InMemoryQueue();

module.exports = deviceEventQueue; 