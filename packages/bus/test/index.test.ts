import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '@social/logger';

const execAsync = promisify(exec);

async function runTestFile(filename: string) {
  Logger.log(`\n${'='.repeat(60)}`);
  Logger.log(`Running: ${filename}`);
  Logger.log('='.repeat(60));
  
  try {
    const { stdout, stderr } = await execAsync(`node dist-test/${filename}`);
    if (stdout) Logger.log(stdout);
    if (stderr) Logger.error(stderr);
  } catch (error: any) {
    Logger.error(`Error running ${filename}:`, error.message);
    if (error.stdout) Logger.log(error.stdout);
    if (error.stderr) Logger.error(error.stderr);
    throw error;
  }
}

async function runAllTests() {
  Logger.info('Starting Bus Package Test Suite');
  Logger.log('='.repeat(60));
  
  try {
    await runTestFile('basic.test.js');
    await runTestFile('priority.test.js');
    await runTestFile('loader.test.js');
    
    Logger.log(`\n${'='.repeat(60)}`);
    Logger.success('All tests completed successfully!');
    Logger.log('='.repeat(60));
  } catch (error) {
    Logger.log(`\n${'='.repeat(60)}`);
    Logger.error('Test suite failed');
    Logger.log('='.repeat(60));
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  Logger.error('Fatal error:', error);
  process.exit(1);
});
