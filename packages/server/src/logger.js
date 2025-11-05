import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pino from 'pino'

// Load environment variables from .env file in monorepo root
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../../.env')
console.log('Server logger: Loading .env from:', envPath)
const dotenvResult = dotenv.config({ path: envPath })
console.log('Server logger: dotenv result:', dotenvResult.error ? 'ERROR: ' + dotenvResult.error.message : 'SUCCESS')

console.log("pino log level is",process.env.LOG_LEVEL)

// Create base pino logger instance with appropriate configuration
const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  base: null, // Remove default fields like pid, hostname
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label }
    }
  }
})

// Create child loggers for different modules (similar to web package)
const loggers = {
  server: baseLogger.child({ module: 'server' }),
  auth: baseLogger.child({ module: 'auth' }),
  api: baseLogger.child({ module: 'api' }),
  graphql: baseLogger.child({ module: 'graphql' }),
  security: baseLogger.child({ module: 'security' }),
  entities: baseLogger.child({ module: 'entities' }),
  relationships: baseLogger.child({ module: 'relationships' })
}

// Legacy wrapper to provide a consistent Logger API (for backwards compatibility)
export const Logger = {
  info: (...args) => baseLogger.info(...args),
  error: (...args) => baseLogger.error(...args),
  warn: (...args) => baseLogger.warn(...args),
  debug: (...args) => baseLogger.debug(...args)
}

// Add a helper to change all log levels at once
export function setGlobalLogLevel(level) {
  baseLogger.level = level
  Object.values(loggers).forEach(logger => {
    logger.level = level
  })
}

// Export individual loggers for more granular control
export default loggers
export { baseLogger }