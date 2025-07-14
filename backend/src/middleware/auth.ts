import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

/**
 * Authentication middleware
 * @param roles - Optional array of required roles
 * @returns Express middleware function
 */
export function authMiddleware(roles: string[] = []) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const token = extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Authentication token required",
        });
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;

      // Check roles if specified
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error("Authentication error:", error);

      if (error.name === "JsonWebTokenError") {
        res.status(401).json({
          success: false,
          message: "Invalid authentication token",
        });
        return;
      }

      if (error.name === "TokenExpiredError") {
        res.status(401).json({
          success: false,
          message: "Authentication token expired",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Authentication error",
      });
    }
  };
}

/**
 * Extract token from request headers or cookies
 * @param req - Express request object
 * @returns JWT token or null
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @returns Express middleware function
 */
export function optionalAuth() {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const token = extractToken(req);

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
      }

      next();
    } catch (error) {
      // Ignore auth errors for optional auth
      next();
    }
  };
}

/**
 * Generate JWT token
 * @param payload - Token payload
 * @param expiresIn - Token expiration (default: 24h)
 * @returns JWT token
 */
export function generateToken(
  payload: object,
  expiresIn: string = "24h",
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 * @param token - JWT token
 * @returns Decoded token payload
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
