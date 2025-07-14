import express, { Router, Request, Response } from "express";
import { paymentService } from "../services/PaymentService.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { logger } from "../config/logger.js";

const router: Router = express.Router();

// Process a payment
router.post(
  "/process",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const payment = await paymentService.processPayment({
        ...paymentData,
        userId,
      });

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      logger.error("Error processing payment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to process payment",
      });
    }
  },
);

// Get payment history for a user
router.get(
  "/history",
  authMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const payments = await paymentService.getPaymentHistory(userId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      logger.error("Error fetching payment history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
      });
    }
  },
);

// Refund a payment
router.post(
  "/:paymentId/refund",
  authMiddleware(["admin", "platform_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { paymentId } = req.params;

      const refund = await paymentService.refundPayment(paymentId);

      res.json({
        success: true,
        data: refund,
      });
    } catch (error: any) {
      logger.error("Error refunding payment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to refund payment",
      });
    }
  },
);

export default router;
