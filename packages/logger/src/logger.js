export class Logger {
  static getCallerInfo() {
    const err = new Error();
    const stack = err.stack.split('\n');
    // Stack typically looks like:
    // Error
    //   at Object.getCallerInfo (...)
    //   at Object.warn/error (...)
    //   at actual caller (...)
    // So we want index 3
    if (stack.length > 3) {
      const callerLine = stack[3].trim();
      // Parse patterns like "at functionName (file:line:col)" or "at file:line:col"
      const match = callerLine.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
      if (match) {
        const functionName = match[1] || '<anonymous>';
        const filePath = match[2];
        const fileName = filePath.split('/').pop().split('\\').pop();
        return `[${fileName}:${functionName}]`;
      }
    }
    return '';
  }

  static log(message, ...args) {
    console.log(`ℹ️  ${message}`, ...args);
  }

  static info(message, ...args) {
    console.log(`ℹ️  ${message}`, ...args);
  }

  static success(message, ...args) {
    console.log(`✅ ${message}`, ...args);
  }

  static warn(message, ...args) {
    const caller = Logger.getCallerInfo();
    console.warn(`⚠️  ${caller} ${message}`, ...args);
  }

  static err(message, error, ...args) {
    const caller = Logger.getCallerInfo();
    console.error(`❌ ${caller} ${message}`, ...args);
    if (error?.stack) {
      console.error(error.stack);
    } else if (error) {
      console.error(error);
    }
  }

  static error(message, error, ...args) {
    const caller = Logger.getCallerInfo();
    console.error(`❌ ${caller} ${message}`, ...args);
    if (error?.stack) {
      console.error(error.stack);
    } else if (error) {
      console.error(error);
    }
  }

  static debug(message, ...args) {
    if (process.env.DEBUG === 'true') {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  static api(method, path, ...args) {
    console.log(`🌐 ${method} ${path}`, ...args);
  }

  static db(operation, collection, ...args) {
    if (process.env.DEBUG === 'true') {
      console.log(`💾 ${operation} ${collection}`, ...args);
    }
  }
}
