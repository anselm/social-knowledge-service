import { Bus } from '../dist/bus.js';
import { loader } from '../dist/loader.js';
import { Logger } from '@social/basic';

async function testLoaderBasic() {
  Logger.info('Test: Loader Basic Functionality on cwd ' + process.cwd());
  
  try {
    const bus = new Bus();

    // Register the loader observer
    await bus.event(loader);

    // Request to load the test module
    await bus.event({
      load: "./test-data/test-file-1.js",
    });

    // Now test if the loaded observer works
    const result = await bus.event({
      dynamicTest: 'Hello from dynamic module'
    });
    
    if (result && result.success && result.value === 'Hello from dynamic module') {
      Logger.success('Test passed: Loader successfully loaded and registered observer');
    } else {
      Logger.error('Test failed: Loaded observer did not work correctly');
      Logger.log('Result:', result);
    }
  } catch (e) {
    Logger.error('Test failed with error:', e);
  }
}

async function testLoaderArray() {
  Logger.info('Test: Loader with Array of Modules');
  
  try {
    
    const bus = new Bus();
    
    // Register the loader observer
    await bus.event(loader);
  
    // Request to load multiple modules
    await bus.event({
      load: [ "./test-data/test-file-2.js", "./test-data/test-file-1.js" ]
    });

    // Test the second loaded observer
    const result = await bus.event({
      secondTest: 'Hello from second module'
    });

    if (result && result.success && result.observer === 2) {
      Logger.success('Test passed: Loader successfully loaded multiple modules');
    } else {
      Logger.error('Test failed: Multiple module loading did not work correctly');
      Logger.log('Result:', result);
    }
  } catch (e) {
    Logger.error('Test failed with error:', e);
  }
}

async function testLoaderDuplicatePrevention() {
  Logger.info('Test: Loader Prevents Duplicate Loading');
    
  try {
    const bus = new Bus();
    
    // Register the loader observer
    await bus.event(loader);
    
    // Load the same module twice
    await bus.event({
      load: "./test-data/test-file-1.js"
    });
    
    await bus.event({
      load: "./test-data/test-file-1.js"
    });
      
    // Count how many observers we have (should not have duplicates)
    const observerCount = bus.observers.length;
    Logger.log('Observer count:', observerCount);
    
    // We should have: on_entity_register, loader, and testObserver (3 total)
    // If we had duplicates, we'd have 4 or more
    if (observerCount === 3) {
      Logger.success('Test passed: Loader prevented duplicate loading');
    } else {
      Logger.error('Test failed: Duplicate prevention did not work');
      Logger.log('Expected 3 observers, got:', observerCount);
    }
  } catch (e) {
    Logger.error('Test failed with error:', e);
  }
}

async function runTests() {
  await testLoaderBasic();
  await testLoaderArray();
  await testLoaderDuplicatePrevention();
}

runTests().catch(console.error);
