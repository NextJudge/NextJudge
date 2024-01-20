import winston from "winston";

const { combine, timestamp, label, printf } = winston.format;

if (process.env.NODE_ENV === "test") {
  winston.configure({
    transports: [new winston.transports.Console({ silent: true })],
  });
}

if (process.env.NODE_ENV === "production") {
  winston.configure({
    transports: [
      new winston.transports.Console({
        format: combine(
          label({ label: "production" }),
          timestamp(),
          printf((info) => {
            return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
          }),
        ),
      }),
    ],
  });
}

if (process.env.NODE_ENV === "development") {
  winston.configure({
    transports: [
      new winston.transports.Console({
        format: combine(
          label({ label: "development" }),
          timestamp(),
          printf((info) => {
            return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
          }),
        ),
      }),
    ],
  });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [new winston.transports.Console({})],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
});

export default logger;
