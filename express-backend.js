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

// In-memory storage
let requests = [];
let coaches = [
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

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-express-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-express-api",
    timestamp: new Date().toISOString(),
  });
});

// Mentorship/Coaching requests
app.post("/mentorship-requests", (req, res) => {
  const newRequest = {
    id: `request_${Date.now()}`,
    ...req.body,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.push(newRequest);
  console.log("Created new coaching request:", newRequest.id);
  res.status(201).json({ data: newRequest });
});

app.get("/mentorship-requests", (req, res) => {
  res.json({ data: requests });
});

app.get("/mentorship-requests/:id", (req, res) => {
  const request = requests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  res.json({ data: request });
});

// Coaches endpoints
app.get("/coaches", (req, res) => {
  res.json({ data: coaches });
});

app.get("/coaches/:id", (req, res) => {
  const coach = coaches.find((c) => c.id === req.params.id);
  if (!coach) {
    return res.status(404).json({ error: "Coach not found" });
  }
  res.json({ data: coach });
});

// Matching endpoint
app.post("/matching/search", (req, res) => {
  const matches = coaches.map((coach) => ({
    coachId: coach.id,
    matchScore: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
    reason: `Strong alignment with ${req.body.filters?.expertise?.[0] || "coaching"} requirements`,
    coach: coach,
  }));

  res.json({ data: matches });
});

app.listen(port, () => {
  console.log(`🚀 Peptok Express API running on http://localhost:${port}`);
  console.log(`📚 Health check: http://localhost:${port}/health`);
});
