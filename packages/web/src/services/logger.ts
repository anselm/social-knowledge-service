import pino from 'pino'

// Create base pino logger instance
const baseLogger = pino({
  level: import.meta.env.VITE_DEV ? 'debug' : 'warn',
  base: null, // Remove default fields like pid, hostname
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  browser: {
    asObject: true,
    serialize: true,
    formatters: {
      level: (label) => {
        return { level: label }
      }
    }
  }
})

// Create child loggers for different modules with enhanced API
const createEnhancedLogger = (baseLogger: any) => ({
  info: (message: string, ...args: any[]) => baseLogger.info(...args, message),
  warn: (message: string, ...args: any[]) => baseLogger.warn(...args, message),
  debug: (message: string, ...args: any[]) => baseLogger.debug(...args, message),
  error: (message: string, error?: Error | any) => {
    if (error) {
      // If error is provided, use Pino's error-first format
      baseLogger.error(error, message)
    } else {
      // If no error, just log the message
      baseLogger.error(message)
    }
  }
})

const loggers = {
  apiClient: createEnhancedLogger(baseLogger.child({ module: 'apiClient' })),
  dataLoader: createEnhancedLogger(baseLogger.child({ module: 'dataLoader' })),
  database: createEnhancedLogger(baseLogger.child({ module: 'database' })),
  api: createEnhancedLogger(baseLogger.child({ module: 'api' })),
  app: createEnhancedLogger(baseLogger.child({ module: 'app' })),
  auth: createEnhancedLogger(baseLogger.child({ module: 'auth' })),
  entities: createEnhancedLogger(baseLogger.child({ module: 'entities' }))
}

// Add a helper to change all log levels at once
export function setGlobalLogLevel(level: string) {
  baseLogger.level = level
  // Note: Child loggers inherit the level from the base logger
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).setLogLevel = setGlobalLogLevel;
  (window as any).loggers = loggers
}

export default loggers
