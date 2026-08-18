class Logger {
  logger = console;
  static _instance;
  constructor() {
    if (Logger._instance) return Logger._instance;
    this.logger =
      process.env.NODE_ENV === "production" ? this.getWinstonLogger() : console;
    Logger._instance = this;
  }

  getWinstonLogger() {
    // Lazily require winston and gracefully fallback if unavailable in packaged builds
    let winstonLib = null;
    try {
      // eslint-disable-next-line global-require
      winstonLib = require("winston");
    } catch (_) {
      // Winston not present (e.g., trimmed desktop build) – revert to console
      return console;
    }

    const logger = winstonLib.createLogger({
      level: "info",
      defaultMeta: { service: "backend" },
      transports: [
        new winstonLib.transports.Console({
          format: winstonLib.format.combine(
            winstonLib.format.colorize(),
            winstonLib.format.printf(
              ({ level, message, service, origin = "" }) => {
                return `\x1b[36m[${service}]\x1b[0m${origin ? `\x1b[33m[${origin}]\x1b[0m` : ""} ${level}: ${message}`;
              }
            )
          ),
        }),
      ],
    });

    function formatArgs(args) {
      return args
        .map((arg) => {
          if (arg instanceof Error) {
            return arg.stack; // If argument is an Error object, return its stack trace
          } else if (typeof arg === "object") {
            return JSON.stringify(arg); // Convert objects to JSON string
          } else {
            return arg; // Otherwise, return as-is
          }
        })
        .join(" ");
    }

    console.log = function (...args) {
      logger.info(formatArgs(args));
    };
    console.error = function (...args) {
      logger.error(formatArgs(args));
    };
    console.info = function (...args) {
      logger.warn(formatArgs(args));
    };
    return logger;
  }
}

/**
 * Sets and overrides Console methods for logging when called.
 * This is a singleton method and will not create multiple loggers.
 * @returns {winston.Logger | console} - instantiated logger interface.
 */
function setLogger() {
  return new Logger().logger;
}
module.exports = setLogger;