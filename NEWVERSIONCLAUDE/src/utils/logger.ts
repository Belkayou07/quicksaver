enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

interface LogConfig {
    minLevel: LogLevel;
    enabled: boolean;
    showTimestamp: boolean;
}

const config: LogConfig = {
    minLevel: LogLevel.DEBUG,
    enabled: true,
    showTimestamp: true
};

type LogContext = 'Background' | 'Content' | 'Price' | 'API' | 'UI';
type LogType = 'background' | 'content' | 'price' | 'api' | 'ui';

function formatMessage(level: LogLevel, context: LogContext, message: string, data?: any): string {
    const timestamp = config.showTimestamp ? `[${new Date().toISOString()}]` : '';
    return `${timestamp} [${level}] [${context}] ${message}`;
}

function shouldLog(level: LogLevel): boolean {
    if (!config.enabled) return false;
    
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
}

function log(level: LogLevel, context: LogContext, message: string, data?: any, type?: LogType): void {
    if (!shouldLog(level)) return;

    const formattedMessage = formatMessage(level, context, message, data);

    switch (level) {
        case LogLevel.DEBUG:
            console.debug(formattedMessage, data !== undefined ? data : '');
            break;
        case LogLevel.INFO:
            console.info(formattedMessage, data !== undefined ? data : '');
            break;
        case LogLevel.WARN:
            console.warn(formattedMessage, data !== undefined ? data : '');
            break;
        case LogLevel.ERROR:
            console.error(formattedMessage, data !== undefined ? data : '');
            break;
    }
}

/**
 * Public logging interface with different log levels and contexts
 */
export const Logger = {
    debug: (context: LogContext, message: string, data?: any, type?: LogType) => 
        log(LogLevel.DEBUG, context, message, data, type),
    info: (context: LogContext, message: string, data?: any, type?: LogType) => 
        log(LogLevel.INFO, context, message, data, type),
    warn: (context: LogContext, message: string, data?: any, type?: LogType) => 
        log(LogLevel.WARN, context, message, data, type),
    error: (context: LogContext, message: string, data?: any, type?: LogType) => 
        log(LogLevel.ERROR, context, message, data, type),

    // Category-specific helpers
    background: {
        debug: (message: string, data?: any) => log(LogLevel.DEBUG, 'Background', message, data, 'background'),
        info: (message: string, data?: any) => log(LogLevel.INFO, 'Background', message, data, 'background'),
        warn: (message: string, data?: any) => log(LogLevel.WARN, 'Background', message, data, 'background'),
        error: (message: string, data?: any) => log(LogLevel.ERROR, 'Background', message, data, 'background'),
    },

    content: {
        debug: (message: string, data?: any) => log(LogLevel.DEBUG, 'Content', message, data, 'content'),
        info: (message: string, data?: any) => log(LogLevel.INFO, 'Content', message, data, 'content'),
        warn: (message: string, data?: any) => log(LogLevel.WARN, 'Content', message, data, 'content'),
        error: (message: string, data?: any) => log(LogLevel.ERROR, 'Content', message, data, 'content'),
    },

    price: {
        debug: (message: string, data?: any) => log(LogLevel.DEBUG, 'Price', message, data, 'price'),
        info: (message: string, data?: any) => log(LogLevel.INFO, 'Price', message, data, 'price'),
        warn: (message: string, data?: any) => log(LogLevel.WARN, 'Price', message, data, 'price'),
        error: (message: string, data?: any) => log(LogLevel.ERROR, 'Price', message, data, 'price'),
    },

    api: {
        debug: (message: string, data?: any) => log(LogLevel.DEBUG, 'API', message, data, 'api'),
        info: (message: string, data?: any) => log(LogLevel.INFO, 'API', message, data, 'api'),
        warn: (message: string, data?: any) => log(LogLevel.WARN, 'API', message, data, 'api'),
        error: (message: string, data?: any) => log(LogLevel.ERROR, 'API', message, data, 'api'),
    },

    ui: {
        debug: (message: string, data?: any) => log(LogLevel.DEBUG, 'UI', message, data, 'ui'),
        info: (message: string, data?: any) => log(LogLevel.INFO, 'UI', message, data, 'ui'),
        warn: (message: string, data?: any) => log(LogLevel.WARN, 'UI', message, data, 'ui'),
        error: (message: string, data?: any) => log(LogLevel.ERROR, 'UI', message, data, 'ui'),
    },

    // Configuration methods
    getConfig: () => ({ ...config }),
    setMinLevel: (level: LogLevel) => { config.minLevel = level; },
    enable: () => { config.enabled = true; },
    disable: () => { config.enabled = false; },
    setShowTimestamp: (show: boolean) => { config.showTimestamp = show; }
}; 