// Simple mock logger for development
// This is a JavaScript version for the development environment

const logger = {
  info: (...args) => {
    console.log("ℹ️  [INFO]", ...args);
  },

  warn: (...args) => {
    console.warn("⚠️  [WARN]", ...args);
  },

  error: (...args) => {
    console.error("❌ [ERROR]", ...args);
  },

  debug: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log("🐛 [DEBUG]", ...args);
    }
  },

  verbose: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log("📝 [VERBOSE]", ...args);
    }
  },
};

export { logger };
export default logger;
