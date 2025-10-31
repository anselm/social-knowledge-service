import { writeSync } from 'fs';

export class Logger {
  static getCallerInfo() {
    // Create error and immediately access stack to force synchronous generation
    const err = new Error();
    const stackString = err.stack || '';
    const lines = stackString.split('\n');
    
    // Stack typically looks like:
    // Error
    //   at Object.getCallerInfo (...)
    //   at Object.warn/error (...)
    //   at actual caller (...)
    // So we want index 3
    if (lines.length <= 3) {
      return '';
    }
    
    const callerLine = lines[3]?.trim() || '';
    
    // Parse patterns like "at functionName (file:line:col)" or "at file:line:col"
    const match = callerLine.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (match) {
      const functionName = match[1] || '<anonymous>';
      const filePath = match[2];
      if (filePath) {
        const fileName = filePath.split('/').pop()?.split('\\').pop();
        return `[${fileName}:${functionName}]`;
      }
    }
    
    return '';
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
