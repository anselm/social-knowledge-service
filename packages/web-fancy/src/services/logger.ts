import log from 'loglevel'

// Configure log levels for different modules
const loggers = {
  apiClient: log.getLogger('apiClient'),
  dataLoader: log.getLogger('dataLoader'),
  database: log.getLogger('database'),
  api: log.getLogger('api'),
  app: log.getLogger('app'),
  auth: log.getLogger('auth'),
  entities: log.getLogger('entities')
}

// Set default log level based on environment
const defaultLevel = 'debug' // import.meta.env.DEV ? 'debug' : 'warn'

// Set default log level to WARN in production, DEBUG in development
// Available levels: TRACE, DEBUG, INFO, WARN, ERROR, SILENT
Object.values(loggers).forEach(logger => {
  logger.setLevel(defaultLevel)
})

// You can override individual loggers like this:
// loggers.apiClient.setLevel('debug')
// loggers.dataLoader.setLevel('info')

// Add a helper to change all log levels at once
export function setGlobalLogLevel(level: log.LogLevelDesc) {
  Object.values(loggers).forEach(logger => {
    logger.setLevel(level)
  })
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).setLogLevel = setGlobalLogLevel;
  (window as any).loggers = loggers
}

export default loggers
