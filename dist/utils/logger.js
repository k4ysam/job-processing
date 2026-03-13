"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LEVEL_ORDER = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const ENV_LEVEL = process.env.LOG_LEVEL ?? 'info';
function shouldLog(level) {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[ENV_LEVEL];
}
function format(level, message, meta) {
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [${level.toUpperCase()}]`;
    if (meta !== undefined) {
        const metaStr = meta instanceof Error
            ? `${meta.message}\n${meta.stack ?? ''}`
            : JSON.stringify(meta, null, 0);
        return `${prefix} ${message} ${metaStr}`;
    }
    return `${prefix} ${message}`;
}
exports.logger = {
    debug(message, meta) {
        if (shouldLog('debug'))
            process.stdout.write(format('debug', message, meta) + '\n');
    },
    info(message, meta) {
        if (shouldLog('info'))
            process.stdout.write(format('info', message, meta) + '\n');
    },
    warn(message, meta) {
        if (shouldLog('warn'))
            process.stderr.write(format('warn', message, meta) + '\n');
    },
    error(message, meta) {
        if (shouldLog('error'))
            process.stderr.write(format('error', message, meta) + '\n');
    },
};
//# sourceMappingURL=logger.js.map