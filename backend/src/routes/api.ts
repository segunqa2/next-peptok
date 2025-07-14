import express, { Router, Request, Response } from "express";
import { authService } from "../services/SimpleAuthService.js";
import { logger } from "../config/logger.js";
import mentorRoutes from "./mentors.js";
import sessionRoutes from "./sessions.js";
import paymentRoutes from "./payments.js";
import matchingRoutes from "./matching.js";
import {
  mockSkills,
  mockExperts,
  mockEmployees,
  mockConnections,
  mockMetrics,
  mockDashboardStats,
  mockDepartmentMetrics,
  mockRecentActivities,
  mockSubscriptionTiers,
  mockCompanyProfiles,
  mockMentorshipRequests,
  mockTeamMembers,
} from "../data/mockData.js";

const router: Router = express.Router();

// Mount sub-routes
router.use("/mentors", mentorRoutes);
router.use("/sessions", sessionRoutes);
router.use("/payments", paymentRoutes);
router.use("/matching", matchingRoutes);

// Authentication routes
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Login error:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
});

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    const result = await authService.register(userData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
});

router.post("/auth/google", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    const result = await authService.loginWithGoogle(token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Google auth error:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
});

router.post("/auth/microsoft", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Microsoft token is required",
      });
    }

    const result = await authService.loginWithMicrosoft(token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Microsoft auth error:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Microsoft authentication failed",
    });
  }
});

router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
    });
  }
});

router.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
});

// Mock data endpoints
router.get("/skills", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockSkills,
  });
});

router.get("/experts", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockExperts,
  });
});

router.get("/employees", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockEmployees,
  });
});

router.get("/connections", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockConnections,
  });
});

router.get("/metrics", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockMetrics,
  });
});

router.get("/dashboard/stats", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockDashboardStats,
  });
});

router.get("/dashboard/departments", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockDepartmentMetrics,
  });
});

router.get("/dashboard/activities", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockRecentActivities,
  });
});

router.get("/subscriptions/tiers", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockSubscriptionTiers,
  });
});

router.get("/companies", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockCompanyProfiles,
  });
});

router.get("/mentorship-requests", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockMentorshipRequests,
  });
});

router.get("/team-members", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockTeamMembers,
  });
});

export default router;
