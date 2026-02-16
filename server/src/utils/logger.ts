type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const base = `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}`;
    if (data && Object.keys(data).length > 0) {
        return `${base} ${JSON.stringify(data)}`;
    }
    return base;
}

export const logger = {
    debug(message: string, data?: Record<string, unknown>) {
        if (shouldLog('debug')) console.debug(formatMessage('debug', message, data));
    },
    info(message: string, data?: Record<string, unknown>) {
        if (shouldLog('info')) console.log(formatMessage('info', message, data));
    },
    warn(message: string, data?: Record<string, unknown>) {
        if (shouldLog('warn')) console.warn(formatMessage('warn', message, data));
    },
    error(message: string, data?: Record<string, unknown>) {
        if (shouldLog('error')) console.error(formatMessage('error', message, data));
    },
};
