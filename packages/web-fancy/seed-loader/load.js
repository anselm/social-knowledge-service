


  // Load seed data if environment variable is set
  await loadSeedDataIfRequested()

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'


// Load environment variables from .env file
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


let seedDataLoaded = false

// Function to reset seed data loaded flag (called when database is flushed)
function resetSeedDataFlag() {
  seedDataLoaded = false
  Logger.info("🔄 Seed data flag reset - will reload on next initialization")
}


async function loadSeedDataIfRequested() {
  // Check if we should load seed data based on environment variable
  const shouldLoadSeedData = process.env.LOAD_SEED_DATA === 'true' || process.env.LOAD_SEED_DATA === '1';
  
  if (shouldLoadSeedData && !seedDataLoaded) {
    try {
      const seedLoader = new SeedLoader(bus)
      const seedDataPath = path.resolve(__dirname, '../seed-data')
      await seedLoader.loadSeedDataRecurse(seedDataPath)
      seedDataLoaded = true
      Logger.info("✅ Seed data loaded successfully")
    } catch (error) {
      Logger.error('Failed to load seed data:', error)
    }
  } else {
    Logger.info('Skipping seed data loading - LOAD_SEED_DATA environment variable not set')
  }
}

// Export reset function for FLUSH_DB scenarios
export { resetSeedDataFlag }
