import pino from 'pino'

// Create pino logger instance with appropriate configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: null, // Remove default fields like pid, hostname
  timestamp: () => `,"time":"${new Date().toISOString()}"`
})

// Wrapper to provide a consistent Logger API using pino
export const Logger = {
  info: (...args) => logger.info(...args),
  error: (...args) => logger.error(...args),
  warn: (...args) => logger.warn(...args),
  debug: (...args) => logger.debug(...args)
}

export default Logger