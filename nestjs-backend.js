const express = require("express");
const cors = require("cors");
const { createConnection } = require("typeorm");
const fs = require("fs");
const path = require("path");

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

// Simple in-memory database simulation
const db = {
  mentorshipRequests: [],
  coaches: [
    {
      id: "coach_1",
      name: "Dr. Sarah Johnson",
      expertise: ["Leadership", "Strategy", "Team Building"],
      experience: "15+ years",
      rating: 4.9,
      bio: "Former Fortune 500 executive with extensive leadership experience.",
      hourlyRate: 200,
      availability: "Available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  matches: [],
  companies: [],
  users: [],
};

// Database file path
const dbFilePath = path.join(__dirname, "peptok-database.json");

// Load data from file if exists
function loadDatabase() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, "utf8");
      const loadedDb = JSON.parse(data);
      Object.assign(db, loadedDb);
      console.log("📁 Database loaded from file");
    }
  } catch (error) {
    console.warn("⚠️ Could not load database file:", error.message);
  }
}

// Save data to file
function saveDatabase() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
    console.log("💾 Database saved to file");
  } catch (error) {
    console.error("❌ Could not save database:", error.message);
  }
}

// Load database on startup
loadDatabase();

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-nestjs-api",
    timestamp: new Date().toISOString(),
    database: {
      requests: db.mentorshipRequests.length,
      coaches: db.coaches.length,
      matches: db.matches.length,
    },
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-nestjs-api",
    timestamp: new Date().toISOString(),
    database: {
      requests: db.mentorshipRequests.length,
      coaches: db.coaches.length,
      matches: db.matches.length,
    },
  });
});

// Mentorship/Coaching requests with database persistence
app.post("/mentorship-requests", (req, res) => {
  const newRequest = {
    id: `request_${Date.now()}`,
    ...req.body,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.mentorshipRequests.push(newRequest);
  saveDatabase();

  console.log("✅ Created new coaching request:", newRequest.id);
  res.status(201).json({ data: newRequest });
});

app.get("/mentorship-requests", (req, res) => {
  console.log(
    "📋 Fetching all coaching requests:",
    db.mentorshipRequests.length,
  );
  res.json({ data: db.mentorshipRequests });
});

app.get("/mentorship-requests/:id", (req, res) => {
  const request = db.mentorshipRequests.find((r) => r.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  console.log("📄 Fetching coaching request:", req.params.id);
  res.json({ data: request });
});

app.put("/mentorship-requests/:id", (req, res) => {
  const index = db.mentorshipRequests.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Request not found" });
  }

  db.mentorshipRequests[index] = {
    ...db.mentorshipRequests[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase();
  console.log("📝 Updated coaching request:", req.params.id);
  res.json({ data: db.mentorshipRequests[index] });
});

// Coaches endpoints with database persistence
app.get("/coaches", (req, res) => {
  console.log("👥 Fetching all coaches:", db.coaches.length);
  res.json({ data: db.coaches });
});

app.get("/coaches/:id", (req, res) => {
  const coach = db.coaches.find((c) => c.id === req.params.id);
  if (!coach) {
    return res.status(404).json({ error: "Coach not found" });
  }
  console.log("👤 Fetching coach:", req.params.id);
  res.json({ data: coach });
});

app.post("/coaches", (req, res) => {
  const newCoach = {
    id: `coach_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.coaches.push(newCoach);
  saveDatabase();

  console.log("✅ Created new coach:", newCoach.id);
  res.status(201).json({ data: newCoach });
});

// Matching endpoint with database persistence
app.post("/matching/search", (req, res) => {
  const { filters, requestId } = req.body;

  // Create matches based on filters
  const matches = db.coaches
    .map((coach) => {
      let matchScore = 0.5; // Base score

      // Score based on expertise alignment
      if (filters?.expertise && coach.expertise) {
        const commonExpertise = filters.expertise.filter((exp) =>
          coach.expertise.some((ce) =>
            ce.toLowerCase().includes(exp.toLowerCase()),
          ),
        );
        matchScore += (commonExpertise.length / filters.expertise.length) * 0.3;
      }

      // Score based on experience
      if (filters?.experience) {
        const expYears = parseInt(coach.experience);
        const reqYears = parseInt(filters.experience);
        if (!isNaN(expYears) && !isNaN(reqYears)) {
          matchScore += Math.min(expYears / reqYears, 1) * 0.2;
        }
      }

      // Ensure score is between 0 and 1
      matchScore = Math.min(Math.max(matchScore, 0.3), 1.0);

      return {
        id: `match_${Date.now()}_${coach.id}`,
        coachId: coach.id,
        requestId: requestId || "unknown",
        matchScore: Math.round(matchScore * 100) / 100,
        reason: `${Math.round(matchScore * 100)}% alignment with ${filters?.expertise?.[0] || "coaching"} requirements`,
        coach: coach,
        createdAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  // Save matches to database
  matches.forEach((match) => {
    const existingMatch = db.matches.find(
      (m) => m.coachId === match.coachId && m.requestId === match.requestId,
    );
    if (!existingMatch) {
      db.matches.push(match);
    }
  });

  saveDatabase();
  console.log(
    "🔍 Generated",
    matches.length,
    "matches for request:",
    requestId,
  );
  res.json({ data: matches });
});

// Get saved matches
app.get("/matching/requests/:requestId", (req, res) => {
  const matches = db.matches.filter(
    (m) => m.requestId === req.params.requestId,
  );
  console.log(
    "📊 Fetching matches for request:",
    req.params.requestId,
    "Found:",
    matches.length,
  );
  res.json({ data: matches });
});

// Database statistics
app.get("/api/v1/stats", (req, res) => {
  res.json({
    database: {
      mentorshipRequests: db.mentorshipRequests.length,
      coaches: db.coaches.length,
      matches: db.matches.length,
      companies: db.companies.length,
      users: db.users.length,
    },
    lastSaved: fs.existsSync(dbFilePath) ? fs.statSync(dbFilePath).mtime : null,
  });
});

// Graceful shutdown with database save
process.on("SIGTERM", () => {
  console.log("🔄 Shutting down gracefully...");
  saveDatabase();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔄 Shutting down gracefully...");
  saveDatabase();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Peptok NestJS-style API running on http://localhost:${port}`);
  console.log(`📚 Health check: http://localhost:${port}/health`);
  console.log(`📊 Stats: http://localhost:${port}/api/v1/stats`);
  console.log(`💾 Database file: ${dbFilePath}`);
});
