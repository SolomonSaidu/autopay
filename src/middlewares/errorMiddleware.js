import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Build a descriptive, structured log message
  const logMessage = `HTTP ${statusCode} - ${req.method} ${req.originalUrl} - Msg: ${err.message} - IP: ${req.ip}`;

  // ⚡ THE INTELLIGENT ROUTING LOGIC
  if (statusCode >= 500) {
    // 1. CRITICAL SYSTEM FAILURES (500+) -> Goes to BOTH error.log and combined.log
    logger.error(logMessage, err);
  } else {
    // 2. USER OPERATIONAL MISTAKES (400-499) -> Only goes to combined.log as a 'warn' or 'info'
    logger.warn(logMessage); // This will bypass error.log completely!
  }

  // Return the standard clean response back to Postman/Frontend
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
