import { writeSync } from 'fs';

export class Logger {
  static getCallerInfo() {
    // Capture stack trace synchronously using V8's prepareStackTrace
    const originalPrepareStackTrace = Error.prepareStackTrace;
    let callerInfo = '';
    
    try {
      Error.prepareStackTrace = (_, stack) => stack;
      const err = { stack: null } as any;
      Error.captureStackTrace(err, Logger.getCallerInfo);
      const stack = err.stack;
      
      // Stack is now an array of CallSite objects
      if (stack && stack.length > 0) {
        const caller = stack[0]; // First frame is the actual caller
        const fileName = caller.getFileName();
        const functionName = caller.getFunctionName() || '<anonymous>';
        
        if (fileName) {
          const shortFileName = fileName.split('/').pop()?.split('\\').pop();
          callerInfo = `[${shortFileName}:${functionName}]`;
        }
      }
    } catch (e) {
      // If anything fails, just return empty string
    } finally {
      Error.prepareStackTrace = originalPrepareStackTrace;
    }
    
    return callerInfo;
  }

  static log(message: string, ...args: any[]) {
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const output = `ℹ️  ${message} ${formatted}\n`;
    writeSync(1, output);
  }

  static info(message: string, ...args: any[]) {
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const output = `ℹ️  ${message} ${formatted}\n`;
    writeSync(1, output);
  }

  static success(message: string, ...args: any[]) {
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const output = `✅ ${message} ${formatted}\n`;
    writeSync(1, output);
  }

  static warn(message: string, ...args: any[]) {
    const caller = Logger.getCallerInfo();
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const output = `⚠️  ${caller} ${message} ${formatted}\n`;
    writeSync(2, output);
  }

  static err(message: string, error?: any, ...args: any[]) {
    const caller = Logger.getCallerInfo();
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    let output = `❌ ${caller} ${message} ${formatted}\n`;
    if (error?.stack) {
      output += error.stack + '\n';
    } else if (error) {
      output += String(error) + '\n';
    }
    writeSync(2, output);
  }

  static error(message: string, error?: any, ...args: any[]) {
    const caller = Logger.getCallerInfo();
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    let output = `❌ ${caller} ${message} ${formatted}\n`;
    if (error?.stack) {
      output += error.stack + '\n';
    } else if (error) {
      output += String(error) + '\n';
    }
    writeSync(2, output);
  }

  static debug(message: string, ...args: any[]) {
    if (process.env.DEBUG === 'true') {
      const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      const output = `🔍 ${message} ${formatted}\n`;
      writeSync(1, output);
    }
  }

  static api(method: string, path: string, ...args: any[]) {
    const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const output = `🌐 ${method} ${path} ${formatted}\n`;
    writeSync(1, output);
  }

  static db(operation: string, collection: string, ...args: any[]) {
    if (process.env.DEBUG === 'true') {
      const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      const output = `💾 ${operation} ${collection} ${formatted}\n`;
      writeSync(1, output);
    }
  }
}
