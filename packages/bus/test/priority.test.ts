import { Bus } from '../dist/bus.js';
import { Logger } from '@social/logger';

async function testObserverPriority() {
  Logger.info('Test: Observer Priority');
  
  const bus = new Bus();
  const callOrder: string[] = [];
  
  // Register observer with priority 1 (will be inserted at index 1)
  const observer1 = {
    meta: { title: 'priority 1 observer' },
    on_entity: {
      priority: 1,
      resolve: async (blob: any, bus: any) => {
        if (blob.test) {
          callOrder.push('observer1');
          Logger.log('Observer 1 called');
        }
      }
    }
  };
  
  // Register observer with priority 2 (will be inserted at index 2)
  const observer2 = {
    meta: { title: 'priority 2 observer' },
    on_entity: {
      priority: 2,
      resolve: async (blob: any, bus: any) => {
        if (blob.test) {
          callOrder.push('observer2');
          Logger.log('Observer 2 called');
        }
      }
    }
  };
  
  // Register observers
  await bus.event(observer2);
  await bus.event(observer1);
  
  // Publish a test object
  await bus.event({ test: true, message: 'Testing priority' });
  
  // Verify call order
  Logger.log('Call order:', callOrder);
  
  if (callOrder[0] === 'observer1' && callOrder[1] === 'observer2') {
    Logger.success('Test passed: Observers called in priority order');
  } else {
    Logger.error('Test failed: Observers not called in correct priority order');
  }
}

async function testArrayUnrolling() {
  Logger.info('\nTest: Array Unrolling');
  
  const bus = new Bus();
  const receivedMessages: string[] = [];
  
  // Register an observer
  const observer = {
    meta: { title: 'array test observer' },
    on_entity: async (blob: any, bus: any) => {
      if (blob.message) {
        receivedMessages.push(blob.message);
        Logger.log('Received message:', blob.message);
      }
    }
  };
  
  await bus.event(observer);
  
  // Publish an array of objects
  await bus.event([
    { message: 'First' },
    { message: 'Second' },
    { message: 'Third' }
  ]);
  
  // Verify all messages were received
  if (receivedMessages.length === 3 && 
      receivedMessages[0] === 'First' &&
      receivedMessages[1] === 'Second' &&
      receivedMessages[2] === 'Third') {
    Logger.success('Test passed: Array was unrolled and all items processed');
  } else {
    Logger.error('Test failed: Array unrolling did not work correctly');
    Logger.log('Received:', receivedMessages);
  }
}

async function runTests() {
  await testObserverPriority();
  await testArrayUnrolling();
}

runTests().catch(console.error);
