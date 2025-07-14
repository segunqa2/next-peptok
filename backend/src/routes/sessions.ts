import express, { Router, Request, Response } from "express";
import { sessionService } from "../services/SessionService.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import {
  validateSessionSchedule,
  validateSessionFeedback,
} from "../middleware/validation.js";
import { logger } from "../config/logger.js";

const router: Router = express.Router();

// Schedule a new session
router.post(
  "/schedule",
  authMiddleware(),
  validateSessionSchedule,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessionRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const session = await sessionService.scheduleSession({
        ...sessionRequest,
        scheduledBy: userId,
      });

      res.status(201).json({
        success: true,
        data: session.toJSON(),
      });
    } catch (error: any) {
      logger.error("Error scheduling session:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to schedule session",
      });
    }
  },
);

// Get session by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSessionById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({
      success: true,
      data: session.toJSON(),
    });
  } catch (error: any) {
    logger.error("Error fetching session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session",
    });
  }
});

// Get sessions for a user
router.get(
  "/user/:userId",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const filters = req.query;

      // Ensure user can only access their own sessions or if admin
      if (
        req.user?.id !== userId &&
        req.user?.role !== "admin" &&
        req.user?.role !== "platform_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const sessions = await sessionService.getSessionsByUser(userId, filters);

      res.json({
        success: true,
        data: sessions.map((session) => session.toJSON()),
      });
    } catch (error: any) {
      logger.error("Error fetching user sessions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch sessions",
      });
    }
  },
);

// Start a session
router.post(
  "/:id/start",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const joinInfo = await sessionService.startSession(id, userId);

      res.json({
        success: true,
        data: joinInfo,
      });
    } catch (error: any) {
      logger.error("Error starting session:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to start session",
      });
    }
  },
);

// Join a session
router.post(
  "/:id/join",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const joinInfo = await sessionService.joinSession(id, userId);

      res.json({
        success: true,
        data: joinInfo,
      });
    } catch (error: any) {
      logger.error("Error joining session:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to join session",
      });
    }
  },
);

// End a session
router.post(
  "/:id/end",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const session = await sessionService.endSession(id, userId);

      res.json({
        success: true,
        data: session.toJSON(),
      });
    } catch (error: any) {
      logger.error("Error ending session:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to end session",
      });
    }
  },
);

// Submit feedback for a session
router.post(
  "/:id/feedback",
  authMiddleware(),
  validateSessionFeedback,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const feedback = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const session = await sessionService.submitFeedback(id, userId, feedback);

      res.json({
        success: true,
        data: session.toJSON(),
      });
    } catch (error: any) {
      logger.error("Error submitting feedback:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit feedback",
      });
    }
  },
);

// Get session statistics for a user
router.get(
  "/stats/:userId",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Ensure user can only access their own stats or if admin
      if (
        req.user?.id !== userId &&
        req.user?.role !== "admin" &&
        req.user?.role !== "platform_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const stats = await sessionService.getSessionStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error("Error fetching session stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch session statistics",
      });
    }
  },
);

export default router;
