import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate mentor filters
 */
export function validateMentorFilters(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors: ValidationError[] = [];

  // Validate expertise if provided
  if (req.body.expertise && !Array.isArray(req.body.expertise)) {
    errors.push({
      field: "expertise",
      message: "Expertise must be an array",
    });
  }

  // Validate experience level if provided
  if (req.body.experienceLevel) {
    const validLevels = ["beginner", "intermediate", "expert", "master"];
    if (!validLevels.includes(req.body.experienceLevel)) {
      errors.push({
        field: "experienceLevel",
        message: "Invalid experience level",
      });
    }
  }

  // Validate rating if provided
  if (
    req.body.minRating &&
    (req.body.minRating < 0 || req.body.minRating > 5)
  ) {
    errors.push({
      field: "minRating",
      message: "Rating must be between 0 and 5",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors,
    });
  }

  next();
}

/**
 * Validate session schedule request
 */
export function validateSessionSchedule(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors: ValidationError[] = [];
  const {
    mentorshipRequestId,
    mentorId,
    title,
    scheduledStartTime,
    scheduledEndTime,
  } = req.body;

  // Required fields
  if (!mentorshipRequestId) {
    errors.push({
      field: "mentorshipRequestId",
      message: "Mentorship request ID is required",
    });
  }

  if (!mentorId) {
    errors.push({
      field: "mentorId",
      message: "Mentor ID is required",
    });
  }

  if (!title) {
    errors.push({
      field: "title",
      message: "Session title is required",
    });
  }

  if (!scheduledStartTime) {
    errors.push({
      field: "scheduledStartTime",
      message: "Scheduled start time is required",
    });
  }

  if (!scheduledEndTime) {
    errors.push({
      field: "scheduledEndTime",
      message: "Scheduled end time is required",
    });
  }

  // Validate date format and logic
  if (scheduledStartTime && scheduledEndTime) {
    const startTime = new Date(scheduledStartTime);
    const endTime = new Date(scheduledEndTime);

    if (isNaN(startTime.getTime())) {
      errors.push({
        field: "scheduledStartTime",
        message: "Invalid start time format",
      });
    }

    if (isNaN(endTime.getTime())) {
      errors.push({
        field: "scheduledEndTime",
        message: "Invalid end time format",
      });
    }

    if (startTime >= endTime) {
      errors.push({
        field: "scheduledEndTime",
        message: "End time must be after start time",
      });
    }

    if (startTime < new Date()) {
      errors.push({
        field: "scheduledStartTime",
        message: "Start time cannot be in the past",
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors,
    });
  }

  next();
}

/**
 * Validate session feedback
 */
export function validateSessionFeedback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors: ValidationError[] = [];
  const { rating, comments } = req.body;

  // Rating is required and must be between 1 and 5
  if (rating === undefined || rating === null) {
    errors.push({
      field: "rating",
      message: "Rating is required",
    });
  } else if (typeof rating !== "number" || rating < 1 || rating > 5) {
    errors.push({
      field: "rating",
      message: "Rating must be a number between 1 and 5",
    });
  }

  // Comments are optional but must be string if provided
  if (comments && typeof comments !== "string") {
    errors.push({
      field: "comments",
      message: "Comments must be a string",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors,
    });
  }

  next();
}

/**
 * Validate payment data
 */
export function validatePayment(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors: ValidationError[] = [];
  const { amount, currency, paymentMethod } = req.body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    errors.push({
      field: "amount",
      message: "Amount must be a positive number",
    });
  }

  if (!currency || typeof currency !== "string") {
    errors.push({
      field: "currency",
      message: "Currency is required",
    });
  }

  if (!paymentMethod || typeof paymentMethod !== "string") {
    errors.push({
      field: "paymentMethod",
      message: "Payment method is required",
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors,
    });
  }

  next();
}
