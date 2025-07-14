import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// General middleware
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "unknown",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Global error handler:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  },
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
