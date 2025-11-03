import pino from 'pino'

// Create base pino logger instance with appropriate configuration
const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
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