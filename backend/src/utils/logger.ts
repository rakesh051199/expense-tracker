import winston from "winston";

const logger = winston.createLogger({
  level: "info", // Log level: error, warn, info, debug
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(), // JSON format (built-in)
  ),
  transports: [
    new winston.transports.Console(), // Logs to console (CloudWatch in AWS Lambda)
  ],
});

export default logger;
