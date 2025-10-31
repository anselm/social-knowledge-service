import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTestFile(filename: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${filename}`);
  console.log('='.repeat(60));
  
  try {
    const { stdout, stderr } = await execAsync(`node dist-test/${filename}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error: any) {
    console.error(`Error running ${filename}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function runAllTests() {
  console.log('Starting Bus Package Test Suite');
  console.log('='.repeat(60));
  
  try {
    await runTestFile('basic.test.js');
    await runTestFile('priority.test.js');
    await runTestFile('loader.test.js');
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.log(`\n${'='.repeat(60)}`);
    console.error('❌ Test suite failed');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
