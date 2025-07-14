const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);
app.use(express.json());

// In-memory storage for demo
let mentorshipRequests = [];
let users = [];
let coaches = [];

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-api",
    timestamp: new Date().toISOString(),
  });
});

// Mentorship requests endpoints
app.post("/mentorship-requests", (req, res) => {
  const newRequest = {
    id: `request_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mentorshipRequests.push(newRequest);
  res.status(201).json({ data: newRequest });
});

app.get("/mentorship-requests", (req, res) => {
  res.json({ data: mentorshipRequests });
});

app.get("/mentorship-requests/:id", (req, res) => {
  const request = mentorshipRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  res.json({ data: request });
});

// Coaches endpoints
app.get("/coaches", (req, res) => {
  const mockCoaches = [
    {
      id: "coach_1",
      name: "Dr. Sarah Johnson",
      expertise: ["Leadership", "Strategy", "Team Building"],
      experience: "15+ years",
      rating: 4.9,
      bio: "Former Fortune 500 executive with extensive leadership experience.",
      hourlyRate: 200,
      availability: "Available",
    },
    {
      id: "coach_2",
      name: "Michael Chen",
      expertise: ["Technology", "Innovation", "Product Management"],
      experience: "12+ years",
      rating: 4.8,
      bio: "Ex-Tech lead at major tech companies, specializing in product strategy.",
      hourlyRate: 180,
      availability: "Available",
    },
  ];
  res.json({ data: mockCoaches });
});

// Matching service endpoint
app.post("/matching/search", (req, res) => {
  const { filters } = req.body;

  // Simple mock matching logic
  const matches = [
    {
      coachId: "coach_1",
      matchScore: 0.95,
      reason: "Strong alignment with leadership requirements",
      coach: {
        id: "coach_1",
        name: "Dr. Sarah Johnson",
        expertise: ["Leadership", "Strategy", "Team Building"],
        experience: "15+ years",
        rating: 4.9,
      },
    },
  ];

  res.json({ data: matches });
});

app.listen(port, () => {
  console.log(`🚀 Simple Peptok API running on http://localhost:${port}`);
  console.log(`📚 Health check available at: http://localhost:${port}/health`);
});
