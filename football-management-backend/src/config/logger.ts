import winston from 'winston';
import { config } from './environment';

/**
 * Logger configuration using Winston
 */
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'football-management-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: config.LOG_FILE.replace('.log', '-error.log'),
      level: 'error',
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: config.LOG_FILE,
    }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Create a stream object with a 'write' function that will be used by Morgan
 */
export const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

/**
 * Log application startup
 */
export const logStartup = (port: number): void => {
  logger.info('🚀 Football Management API starting up', {
    port,
    environment: config.NODE_ENV,
    logLevel: config.LOG_LEVEL,
  });
};

/**
 * Log application shutdown
 */
export const logShutdown = (): void => {
  logger.info('🛑 Football Management API shutting down');
};

/**
 * Log database connection
 */
export const logDatabaseConnection = (): void => {
  logger.info('📊 Database connection established', {
    database: config.DATABASE_PATH,
  });
};

/**
 * Log scheduled job execution
 */
export const logScheduledJob = (jobName: string, success: boolean, message?: string): void => {
  logger.info('⏰ Scheduled job executed', {
    jobName,
    success,
    message,
    timestamp: new Date().toISOString(),
  });
}; 