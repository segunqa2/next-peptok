import express, { Router, Request, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { kafkaIntegrationService } from "../services/KafkaIntegrationService.js";
import { logger } from "../config/logger.js";

const router: Router = express.Router();

// Store pending matching requests
const pendingMatches = new Map<string, any>();

// Request coach matching
router.post(
  "/request",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        program_id,
        title,
        description,
        session_type = "one_on_one",
        priority = "medium",
        skills_required = [],
        experience_level = "intermediate",
        budget_constraints = {
          max_hourly_rate: 150,
          currency: "USD",
          payment_frequency: "hourly",
        },
        availability_requirements = {
          days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
          time_slots: ["09:00-17:00"],
          timezone: "UTC",
          flexibility: 0.5,
        },
        preferred_languages = ["English"],
        participants_count = 1,
        session_duration_minutes = 60,
        total_sessions = 1,
        start_date,
        end_date,
      } = req.body;

      const userId = req.user?.id;
      const companyId = req.user?.companyId || "default-company";

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: "Title and description are required",
        });
      }

      // Create matching request
      const matchingRequest = {
        company_id: companyId,
        program_id: program_id || `program_${Date.now()}`,
        title,
        description,
        session_type,
        priority,
        skills_required: skills_required.map((skill: any) => ({
          name: skill.name,
          level: skill.level || "intermediate",
          weight: skill.weight || 1.0,
          mandatory: skill.mandatory || false,
        })),
        experience_level,
        budget_constraints,
        availability_requirements,
        preferred_languages,
        participants_count,
        session_duration_minutes,
        total_sessions,
        start_date,
        end_date,
        created_by: userId,
      };

      // Send request to matching service via Kafka
      const requestId =
        await kafkaIntegrationService.requestCoachMatching(matchingRequest);

      // Store request info for tracking
      pendingMatches.set(requestId, {
        ...matchingRequest,
        request_id: requestId,
        status: "pending",
        created_at: new Date().toISOString(),
        user_id: userId,
      });

      // Register response handler
      kafkaIntegrationService.registerResponseHandler(requestId, (response) => {
        // Update pending match with response
        const pendingMatch = pendingMatches.get(requestId);
        if (pendingMatch) {
          pendingMatches.set(requestId, {
            ...pendingMatch,
            status: "completed",
            matches: response.matches,
            processing_time_ms: response.processing_time_ms,
            algorithm_version: response.algorithm_version,
            completed_at: new Date().toISOString(),
          });
        }

        logger.info(
          `Matching completed for request ${requestId}: ${response.matches.length} matches found`,
        );
      });

      res.status(202).json({
        success: true,
        data: {
          request_id: requestId,
          status: "pending",
          message: "Matching request submitted successfully",
          estimated_processing_time: "10-30 seconds",
        },
      });
    } catch (error: any) {
      logger.error("Error submitting matching request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit matching request",
        error: error.message,
      });
    }
  },
);

// Get matching results
router.get(
  "/results/:requestId",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id;

      const matchingData = pendingMatches.get(requestId);

      if (!matchingData) {
        return res.status(404).json({
          success: false,
          message: "Matching request not found",
        });
      }

      // Check if user has access to this request
      if (
        matchingData.user_id !== userId &&
        req.user?.role !== "admin" &&
        req.user?.role !== "platform_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: {
          request_id: requestId,
          status: matchingData.status,
          matches: matchingData.matches || [],
          processing_time_ms: matchingData.processing_time_ms || 0,
          algorithm_version: matchingData.algorithm_version,
          created_at: matchingData.created_at,
          completed_at: matchingData.completed_at,
          total_matches: matchingData.matches?.length || 0,
          request_details: {
            title: matchingData.title,
            description: matchingData.description,
            session_type: matchingData.session_type,
            skills_required: matchingData.skills_required,
            budget_constraints: matchingData.budget_constraints,
          },
        },
      });
    } catch (error: any) {
      logger.error("Error getting matching results:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get matching results",
        error: error.message,
      });
    }
  },
);

// Get all matching requests for a user
router.get(
  "/history",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { status, limit = 20, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      // Filter matches by user
      const userMatches = Array.from(pendingMatches.values())
        .filter((match) => match.user_id === userId)
        .filter((match) => !status || match.status === status)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(Number(offset), Number(offset) + Number(limit));

      res.json({
        success: true,
        data: {
          matches: userMatches.map((match) => ({
            request_id: match.request_id,
            title: match.title,
            status: match.status,
            created_at: match.created_at,
            completed_at: match.completed_at,
            total_matches: match.matches?.length || 0,
            processing_time_ms: match.processing_time_ms || 0,
          })),
          total: userMatches.length,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
          },
        },
      });
    } catch (error: any) {
      logger.error("Error getting matching history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get matching history",
        error: error.message,
      });
    }
  },
);

// Cancel a pending matching request
router.delete(
  "/:requestId",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id;

      const matchingData = pendingMatches.get(requestId);

      if (!matchingData) {
        return res.status(404).json({
          success: false,
          message: "Matching request not found",
        });
      }

      // Check if user has access to this request
      if (
        matchingData.user_id !== userId &&
        req.user?.role !== "admin" &&
        req.user?.role !== "platform_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Can only cancel pending requests
      if (matchingData.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only cancel pending requests",
        });
      }

      // Update status to cancelled
      pendingMatches.set(requestId, {
        ...matchingData,
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "Matching request cancelled successfully",
      });
    } catch (error: any) {
      logger.error("Error cancelling matching request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel matching request",
        error: error.message,
      });
    }
  },
);

// Get matching service health status
router.get("/health", async (req: Request, res: Response) => {
  try {
    const kafkaHealth = await kafkaIntegrationService.getServiceHealth();

    res.json({
      success: true,
      data: {
        kafka_integration: kafkaHealth ? "healthy" : "unhealthy",
        pending_requests: pendingMatches.size,
        service_status: "operational",
      },
    });
  } catch (error: any) {
    logger.error("Error checking matching service health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check service health",
      error: error.message,
    });
  }
});

export default router;
