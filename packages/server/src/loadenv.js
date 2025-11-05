import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Aggressively tries to load .env files from multiple locations
 * Returns true if any .env file was successfully loaded
 */
export function loadEnv() {
  const possiblePaths = [
    // Current directory
    resolve(process.cwd(), '.env'),
    // Relative to this file
    resolve(__dirname, '.env'),
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../../.env'), 
    resolve(__dirname, '../../../.env'),
    // Common project locations
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../../.env'),
  ];

  let loaded = false;
  let loadedFrom = null;

  for (const envPath of possiblePaths) {
    if (existsSync(envPath)) {
      try {
        const result = config({ path: envPath });
        if (!result.error) {
          loaded = true;
          loadedFrom = envPath;
          console.log(`✅ Loaded .env from: ${envPath}`);
          break;
        } else {
          console.log(`⚠️  Failed to parse .env at: ${envPath} - ${result.error.message}`);
        }
      } catch (error) {
        console.log(`⚠️  Error loading .env from: ${envPath} - ${error.message}`);
      }
    }
  }

  if (!loaded) {
    console.log('⚠️  No .env file found in any of the attempted locations:');
    possiblePaths.forEach(path => console.log(`   - ${path}`));
    console.log('📝 Continuing with existing environment variables...');
  }

  return { loaded, loadedFrom };
}