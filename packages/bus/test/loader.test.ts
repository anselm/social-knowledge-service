import { Bus } from '../dist/bus.js';
import { loader } from '../dist/loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Create a temporary test module
const testModuleDir = join(process.cwd(), 'test-modules');
const testModulePath = join(testModuleDir, 'test-observer.js');

function setupTestModule() {
  try {
    mkdirSync(testModuleDir, { recursive: true });
    
    const moduleContent = `
export const testObserver = {
  meta: { title: 'dynamically loaded observer' },
  on_entity: async (blob, bus) => {
    if (blob.dynamicTest) {
      console.log('Dynamic observer received:', blob.dynamicTest);
      return { success: true, value: blob.dynamicTest };
    }
  }
};
`;
    
    writeFileSync(testModulePath, moduleContent);
    console.log('✅ Test module created at:', testModulePath);
  } catch (e) {
    console.error('Failed to create test module:', e);
  }
}

function cleanupTestModule() {
  try {
    rmSync(testModuleDir, { recursive: true, force: true });
    console.log('✅ Test module cleaned up');
  } catch (e) {
    console.error('Failed to cleanup test module:', e);
  }
}

async function testLoaderBasic() {
  console.log('\nTest: Loader Basic Functionality');
  
  setupTestModule();
  
  try {
    const bus = new Bus();
    
    // Register the loader observer
    await bus.bus(loader);
    
    // Request to load the test module
    await bus.bus({
      load: testModulePath,
      anchor: process.cwd()
    });
    
    // Give it a moment to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now test if the loaded observer works
    const result = await bus.bus({
      dynamicTest: 'Hello from dynamic module'
    });
    
    if (result && result.success && result.value === 'Hello from dynamic module') {
      console.log('✅ Test passed: Loader successfully loaded and registered observer');
    } else {
      console.log('❌ Test failed: Loaded observer did not work correctly');
      console.log('Result:', result);
    }
  } catch (e) {
    console.error('❌ Test failed with error:', e);
  } finally {
    cleanupTestModule();
  }
}

async function testLoaderArray() {
  console.log('\nTest: Loader with Array of Modules');
  
  setupTestModule();
  
  // Create a second test module
  const testModule2Path = join(testModuleDir, 'test-observer2.js');
  const moduleContent2 = `
export const testObserver2 = {
  meta: { title: 'second dynamically loaded observer' },
  on_entity: async (blob, bus) => {
    if (blob.secondTest) {
      console.log('Second dynamic observer received:', blob.secondTest);
      return { success: true, value: blob.secondTest, observer: 2 };
    }
  }
};
`;
  
  try {
    writeFileSync(testModule2Path, moduleContent2);
    
    const bus = new Bus();
    
    // Register the loader observer
    await bus.bus(loader);
    
    // Request to load multiple modules
    await bus.bus({
      load: [testModulePath, testModule2Path],
      anchor: process.cwd()
    });
    
    // Give it a moment to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test the second loaded observer
    const result = await bus.bus({
      secondTest: 'Hello from second module'
    });
    
    if (result && result.success && result.observer === 2) {
      console.log('✅ Test passed: Loader successfully loaded multiple modules');
    } else {
      console.log('❌ Test failed: Multiple module loading did not work correctly');
      console.log('Result:', result);
    }
  } catch (e) {
    console.error('❌ Test failed with error:', e);
  } finally {
    cleanupTestModule();
  }
}

async function testLoaderDuplicatePrevention() {
  console.log('\nTest: Loader Prevents Duplicate Loading');
  
  setupTestModule();
  
  try {
    const bus = new Bus();
    
    // Register the loader observer
    await bus.bus(loader);
    
    // Load the same module twice
    await bus.bus({
      load: testModulePath,
      anchor: process.cwd()
    });
    
    await bus.bus({
      load: testModulePath,
      anchor: process.cwd()
    });
    
    // Give it a moment to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Count how many observers we have (should not have duplicates)
    const observerCount = bus.observers.length;
    console.log('Observer count:', observerCount);
    
    // We should have: on_entity_register, loader, and testObserver (3 total)
    // If we had duplicates, we'd have 4 or more
    if (observerCount === 3) {
      console.log('✅ Test passed: Loader prevented duplicate loading');
    } else {
      console.log('❌ Test failed: Duplicate prevention did not work');
      console.log('Expected 3 observers, got:', observerCount);
    }
  } catch (e) {
    console.error('❌ Test failed with error:', e);
  } finally {
    cleanupTestModule();
  }
}

async function runTests() {
  await testLoaderBasic();
  await testLoaderArray();
  await testLoaderDuplicatePrevention();
}

runTests().catch(console.error);
