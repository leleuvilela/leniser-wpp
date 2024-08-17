import { createLogger, format, transports } from 'winston';

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = createLogger({
    level,
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new transports.File({ filename: 'tmp/errors.log', level: 'error' }),
        new transports.File({ filename: 'tmp/combined.log' }),
        new transports.Console(),
    ],
});

export { logger };
