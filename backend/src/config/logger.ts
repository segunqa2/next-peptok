import winston from "winston";
import path from "path";

const logLevel = process.env.LOG_LEVEL || "info";
const isProduction = process.env.NODE_ENV === "production";

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  }),
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), consoleFormat),
    }),
  );
}

// File transports for production
if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "combined.log"),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "peptok-backend" },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "rejections.log"),
    }),
  ],
});

// Stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
