import winston from "winston";
import path from "path";

// Define the directory path where logs will live
const logDirectory = path.join(process.cwd(), "logs");

// Configure the clean, scannable text structure for log files
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    // 1. Check if an explicit error stack trace exists in the logging context
    if (info.stack) {
      return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${
        info.message
      }\n${info.stack}\n---------------------------------------------------`;
    }
    // 2. Fallback for standard system tracking info events
    return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`;
  })
);

const logger = winston.createLogger({
  level: "info", // Logs everything at 'info' level and worse (warn, error)
  format: logFormat,
  transports: [
    // 1. Write all errors explicitly to error.log
    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
    // 2. Write all runtime information and system traces to combined.log
    new winston.transports.File({
      filename: path.join(logDirectory, "combined.log"),
    }),
  ],
});

// If we are in local development, also mirror the outputs to the terminal with colors
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message }) => `⚡ [${level}]: ${message}`
        )
      ),
    })
  );
}

export default logger;
