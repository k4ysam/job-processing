type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const ENV_LEVEL = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[ENV_LEVEL];
}

function format(level: LogLevel, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    const metaStr =
      meta instanceof Error
        ? `${meta.message}\n${meta.stack ?? ''}`
        : JSON.stringify(meta, null, 0);
    return `${prefix} ${message} ${metaStr}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (shouldLog('debug')) process.stdout.write(format('debug', message, meta) + '\n');
  },
  info(message: string, meta?: unknown): void {
    if (shouldLog('info')) process.stdout.write(format('info', message, meta) + '\n');
  },
  warn(message: string, meta?: unknown): void {
    if (shouldLog('warn')) process.stderr.write(format('warn', message, meta) + '\n');
  },
  error(message: string, meta?: unknown): void {
    if (shouldLog('error')) process.stderr.write(format('error', message, meta) + '\n');
  },
};
