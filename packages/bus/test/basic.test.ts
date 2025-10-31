import { Bus } from '../dist/bus.js';
import { Logger } from '@social/logger';

async function testBasicObserver() {
  Logger.info('Test: Basic Observer');
  
  const bus = new Bus();
  let observerCalled = false;
  let receivedBlob: any = null;
  
  // Register an observer
  const observer = {
    meta: { title: 'test observer' },
    on_entity: async (blob: any, bus: any) => {
      observerCalled = true;
      receivedBlob = blob;
      Logger.log('Observer received:', blob);
    }
  };
  
  // Register the observer by passing it through the bus
  await bus.event(observer);
  
  // Publish an object
  const testObject = { message: 'Hello from test' };
  await bus.event(testObject);
  
  // Verify
  if (observerCalled && receivedBlob?.message === 'Hello from test') {
    Logger.success('Test passed: Observer was called with correct data');
  } else {
    Logger.error('Test failed: Observer was not called or received wrong data');
  }
}

async function testFilteredObserver() {
  Logger.info('\nTest: Filtered Observer');
  
  const bus = new Bus();
  let observerCalled = false;
  
  // Register an observer with a filter
  const observer = {
    meta: { title: 'filtered observer' },
    on_entity: {
      filter: 'user',
      resolve: async (blob: any, bus: any) => {
        observerCalled = true;
        Logger.log('Filtered observer received:', blob);
      }
    }
  };
  
  // Register the observer
  await bus.event(observer);
  
  // Publish an object without the filter property (should not trigger)
  await bus.event({ message: 'No user property' });
  
  if (observerCalled) {
    Logger.error('Test failed: Observer should not have been called');
    return;
  }
  
  // Publish an object with the filter property (should trigger)
  await bus.event({ user: 'Alice', message: 'Has user property' });
  
  if (observerCalled) {
    Logger.success('Test passed: Filtered observer was called only for matching objects');
  } else {
    Logger.error('Test failed: Filtered observer was not called');
  }
}

async function runTests() {
  await testBasicObserver();
  await testFilteredObserver();
}

runTests().catch(console.error);
