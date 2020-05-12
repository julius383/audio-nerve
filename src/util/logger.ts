import * as winston from "winston";
const { printf, timestamp, combine } = winston.format;
const logFormat = printf(({ level, message, timestamp: time }) => {
    return `${level.toUpperCase()}: ${time}: ${message}`;
});

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: combine(timestamp(), logFormat),
        }),
    ],
});

export default logger;
