import * as winston from "winston";
const { printf, timestamp, combine, colorize } = winston.format;
const logFormat = printf(({ level, message, timestamp: time }) => {
  return `${level}: ${time}: ${message}`;
});

const logger = winston.createLogger({
  format: combine(colorize({ all: true }), timestamp(), logFormat),
  transports: [new winston.transports.Console()],
  level: "debug",
});

export default logger;
