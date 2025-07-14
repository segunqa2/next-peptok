import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { IAuthService } from "@/services/interfaces/IAuthService.js";
import { logger } from "@/config/logger.js";

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const { email, password, rememberMe } = req.body;
      const result = await this.authService.login({
        email,
        password,
        rememberMe,
      });

      // Set HTTP-only cookie for refresh token
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user.getProfile(),
          token: result.token,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error("Login controller error:", error);
      res.status(401).json({
        success: false,
        error: error.message || "Authentication failed",
      });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const registerData = req.body;
      const result = await this.authService.register(registerData);

      // Set HTTP-only cookie for refresh token
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user.getProfile(),
          token: result.token,
          expiresIn: result.expiresIn,
        },
        message: "Registration successful. Please verify your email.",
      });
    } catch (error) {
      logger.error("Registration controller error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Registration failed",
      });
    }
  };

  oauthCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const oauthData = req.body;
      const result = await this.authService.authenticateOAuth(oauthData);

      // Set HTTP-only cookie for refresh token
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user.getProfile(),
          token: result.token,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error("OAuth callback controller error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "OAuth authentication failed",
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: "Refresh token not provided",
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new HTTP-only cookie for refresh token
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user.getProfile(),
          token: result.token,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error("Refresh token controller error:", error);
      res.status(401).json({
        success: false,
        error: error.message || "Token refresh failed",
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        await this.authService.logout(token);
      }

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout controller error:", error);
      res.status(500).json({
        success: false,
        error: "Logout failed",
      });
    }
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const { email } = req.body;
      await this.authService.requestPasswordReset(email);

      res.json({
        success: true,
        message:
          "If an account with that email exists, password reset instructions have been sent.",
      });
    } catch (error) {
      logger.error("Password reset request controller error:", error);
      res.status(500).json({
        success: false,
        error: "Password reset request failed",
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const { token, password } = req.body;
      await this.authService.resetPassword(token, password);

      res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      logger.error("Password reset controller error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Password reset failed",
      });
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      await this.authService.verifyEmail(token);

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      logger.error("Email verification controller error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Email verification failed",
      });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      // User is attached to request by auth middleware
      const user = (req as any).user;

      res.json({
        success: true,
        data: user.getProfile(),
      });
    } catch (error) {
      logger.error("Get current user controller error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user information",
      });
    }
  };
}
