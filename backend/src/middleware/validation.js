import { body, validationResult, query } from "express-validator";
import { logger } from "../config/logger.js";

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validation errors:", errors.array());
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Authentication validation
export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

export const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must be at least 8 characters and contain uppercase, lowercase, and number",
    ),
  body("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters"),
  body("userType")
    .isIn(["enterprise", "coach", "admin"])
    .withMessage("User type must be enterprise, coach, or admin"),
  handleValidationErrors,
];

export const validateOAuth = [
  body("token").notEmpty().withMessage("OAuth token is required"),
  handleValidationErrors,
];

// User management validation
export const validateUserUpdate = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must be at least 2 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Last name must be at least 2 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

// Mentorship request validation
export const validateMentorshipRequest = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("goals")
    .isArray({ min: 1 })
    .withMessage("At least one goal is required"),
  body("goals.*.description")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Goal description must be between 5 and 200 characters"),
  body("teamMembers")
    .optional()
    .isArray()
    .withMessage("Team members must be an array"),
  body("companyId").notEmpty().withMessage("Company ID is required"),
  handleValidationErrors,
];

// Mentor filtering validation
export const validateMentorFilters = [
  query("expertise")
    .optional()
    .isArray()
    .withMessage("Expertise must be an array"),
  query("experienceLevel")
    .optional()
    .isIn(["beginner", "intermediate", "expert", "master"])
    .withMessage(
      "Experience level must be beginner, intermediate, expert, or master",
    ),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Minimum rating must be between 0 and 5"),
  query("maxHourlyRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum hourly rate must be a positive number"),
  query("languages")
    .optional()
    .isArray()
    .withMessage("Languages must be an array"),
  handleValidationErrors,
];

// Session scheduling validation
export const validateSessionSchedule = [
  body("mentorshipRequestId")
    .notEmpty()
    .withMessage("Mentorship request ID is required"),
  body("mentorId").notEmpty().withMessage("Mentor ID is required"),
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("scheduledStartTime")
    .isISO8601()
    .toDate()
    .withMessage("Valid start time is required"),
  body("scheduledEndTime")
    .isISO8601()
    .toDate()
    .withMessage("Valid end time is required"),
  body("type")
    .isIn(["video", "audio", "chat", "screen_share"])
    .withMessage("Session type must be video, audio, chat, or screen_share"),
  body("participants")
    .isArray({ min: 1 })
    .withMessage("At least one participant is required"),
  // Custom validation for end time after start time
  body("scheduledEndTime").custom((endTime, { req }) => {
    const startTime = new Date(req.body.scheduledStartTime);
    const end = new Date(endTime);
    if (end <= startTime) {
      throw new Error("End time must be after start time");
    }
    return true;
  }),
  // Custom validation for future scheduling
  body("scheduledStartTime").custom((startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    if (start <= now) {
      throw new Error("Session must be scheduled in the future");
    }
    return true;
  }),
  handleValidationErrors,
];

// Session feedback validation
export const validateSessionFeedback = [
  body("toUserId").notEmpty().withMessage("Target user ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("feedback")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Feedback must be between 10 and 1000 characters"),
  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("Anonymous flag must be boolean"),
  handleValidationErrors,
];

// Payment validation
export const validatePaymentIntent = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "GBP"])
    .withMessage("Currency must be USD, EUR, or GBP"),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),
  handleValidationErrors,
];

export const validateSubscription = [
  body("customerId").notEmpty().withMessage("Customer ID is required"),
  body("priceId").notEmpty().withMessage("Price ID is required"),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),
  handleValidationErrors,
];

export const validateSubscriptionUpgrade = [
  body("newPriceId").notEmpty().withMessage("New price ID is required"),
  handleValidationErrors,
];

export const validateSeatPurchase = [
  body("quantity")
    .isInt({ min: 1, max: 100 })
    .withMessage("Quantity must be between 1 and 100"),
  body("currentTierId").notEmpty().withMessage("Current tier ID is required"),
  handleValidationErrors,
];

// Company validation
export const validateCompany = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("industry")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Industry must not exceed 50 characters"),
  body("size")
    .optional()
    .isIn(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .withMessage("Invalid company size"),
  body("subscriptionTier")
    .optional()
    .isIn(["starter", "growth", "enterprise"])
    .withMessage("Invalid subscription tier"),
  handleValidationErrors,
];

// Team member validation
export const validateTeamMember = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("role")
    .isIn(["participant", "observer", "admin"])
    .withMessage("Role must be participant, observer, or admin"),
  body("companyId").notEmpty().withMessage("Company ID is required"),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];
