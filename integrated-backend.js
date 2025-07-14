const express = require("express");
const cors = require("cors");
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

// Advanced Matching Service
class AdvancedMatchingService {
  constructor() {
    this.initializeSampleCoaches();
  }

  initializeSampleCoaches() {
    this.coaches = [
      {
        id: "coach_1",
        name: "Dr. Sarah Johnson",
        expertise: [
          "Leadership",
          "Strategy",
          "Team Building",
          "Executive Coaching",
        ],
        experience: "15+ years",
        rating: 4.9,
        bio: "Former Fortune 500 executive with extensive leadership experience.",
        hourlyRate: 200,
        availability: "Available",
        createdAt: new Date().toISOString(),
      },
      {
        id: "coach_2",
        name: "Michael Chen",
        expertise: ["Technology", "Innovation", "Product Management", "Agile"],
        experience: "12+ years",
        rating: 4.8,
        bio: "Ex-Tech lead at major tech companies, specializing in product strategy.",
        hourlyRate: 180,
        availability: "Available",
        createdAt: new Date().toISOString(),
      },
      {
        id: "coach_3",
        name: "Emma Rodriguez",
        expertise: [
          "Marketing",
          "Sales",
          "Customer Success",
          "Growth Strategy",
        ],
        experience: "10+ years",
        rating: 4.7,
        bio: "Marketing executive with proven track record in scaling startups.",
        hourlyRate: 160,
        availability: "Available",
        createdAt: new Date().toISOString(),
      },
      {
        id: "coach_4",
        name: "David Kim",
        expertise: [
          "Finance",
          "Operations",
          "Process Improvement",
          "Analytics",
        ],
        experience: "8+ years",
        rating: 4.6,
        bio: "Operations expert specializing in efficiency and data-driven decisions.",
        hourlyRate: 140,
        availability: "Available",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  calculateExpertiseScore(coachExpertise, requiredExpertise) {
    if (!requiredExpertise || !coachExpertise) return 0.3;

    let matches = 0;
    requiredExpertise.forEach((reqSkill) => {
      coachExpertise.forEach((coachSkill) => {
        if (
          reqSkill.toLowerCase().includes(coachSkill.toLowerCase()) ||
          coachSkill.toLowerCase().includes(reqSkill.toLowerCase())
        ) {
          matches++;
          return; // Break inner loop
        }
      });
    });

    return Math.min(matches / requiredExpertise.length, 1.0);
  }

  calculateExperienceScore(coachExperience, requiredLevel) {
    try {
      const coachYears = parseInt(coachExperience.match(/\d+/)?.[0] || "0");
      const requiredYears = parseInt(requiredLevel?.match(/\d+/)?.[0] || "5");

      if (coachYears >= requiredYears) return 1.0;
      return coachYears / requiredYears;
    } catch {
      return 0.5;
    }
  }

  calculateRatingScore(rating) {
    return Math.min(rating / 5.0, 1.0);
  }

  generateMatches(requestData) {
    const requiredExpertise =
      requestData.expertise || requestData.goals?.map((g) => g.title) || [];
    const requiredExperience = requestData.experience || "5+ years";
    const requestId = requestData.id || `request_${Date.now()}`;

    const matches = this.coaches.map((coach) => {
      // Calculate individual scores
      const expertiseScore = this.calculateExpertiseScore(
        coach.expertise,
        requiredExpertise,
      );
      const experienceScore = this.calculateExperienceScore(
        coach.experience,
        requiredExperience,
      );
      const ratingScore = this.calculateRatingScore(coach.rating);

      // Weighted final score
      const finalScore = Math.max(
        expertiseScore * 0.5 + experienceScore * 0.3 + ratingScore * 0.2,
        0.3,
      );

      // Generate reason
      const reasonParts = [];
      if (expertiseScore > 0.7) reasonParts.push("Strong expertise alignment");
      if (experienceScore > 0.8) reasonParts.push("Excellent experience match");
      if (ratingScore > 0.9) reasonParts.push("Outstanding client ratings");

      const reason =
        reasonParts.length > 0
          ? reasonParts.join(", ")
          : `${Math.round(finalScore * 100)}% overall compatibility`;

      return {
        id: `match_${Date.now()}_${coach.id}`,
        coachId: coach.id,
        requestId: requestId,
        matchScore: Math.round(finalScore * 100) / 100,
        reason: reason,
        coach: coach,
        createdAt: new Date().toISOString(),
        scores: {
          expertise: Math.round(expertiseScore * 100) / 100,
          experience: Math.round(experienceScore * 100) / 100,
          rating: Math.round(ratingScore * 100) / 100,
        },
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    console.log(
      `🔍 Generated ${matches.length} matches for request ${requestId}`,
    );
    return matches;
  }

  getCoaches() {
    return this.coaches;
  }

  addCoach(coachData) {
    const newCoach = {
      id: `coach_${Date.now()}`,
      ...coachData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.coaches.push(newCoach);
    return newCoach;
  }
}

// Database simulation with file persistence
class DatabaseService {
  constructor() {
    this.dbFile = path.join(__dirname, "peptok-database.json");
    this.data = {
      mentorshipRequests: [],
      coaches: [],
      matches: [],
      companies: [],
      users: [],
      sessions: [],
    };
    this.loadDatabase();
  }

  loadDatabase() {
    try {
      if (fs.existsSync(this.dbFile)) {
        const fileData = fs.readFileSync(this.dbFile, "utf8");
        this.data = { ...this.data, ...JSON.parse(fileData) };
        console.log("📁 Database loaded from file");
      }
    } catch (error) {
      console.warn("⚠️ Could not load database file:", error.message);
    }
  }

  saveDatabase() {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2));
      console.log("💾 Database saved to file");
    } catch (error) {
      console.error("❌ Could not save database:", error.message);
    }
  }

  // CRUD operations for mentorship requests
  createRequest(requestData) {
    const newRequest = {
      id: `request_${Date.now()}`,
      ...requestData,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.mentorshipRequests.push(newRequest);
    this.saveDatabase();
    return newRequest;
  }

  getAllRequests() {
    return this.data.mentorshipRequests;
  }

  getRequest(id) {
    return this.data.mentorshipRequests.find((r) => r.id === id);
  }

  updateRequest(id, updateData) {
    const index = this.data.mentorshipRequests.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.data.mentorshipRequests[index] = {
        ...this.data.mentorshipRequests[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      this.saveDatabase();
      return this.data.mentorshipRequests[index];
    }
    return null;
  }

  // Save matches
  saveMatches(matches) {
    matches.forEach((match) => {
      const existingIndex = this.data.matches.findIndex(
        (m) => m.coachId === match.coachId && m.requestId === match.requestId,
      );
      if (existingIndex !== -1) {
        this.data.matches[existingIndex] = match;
      } else {
        this.data.matches.push(match);
      }
    });
    this.saveDatabase();
  }

  getMatches(requestId) {
    return this.data.matches.filter((m) => m.requestId === requestId);
  }

  getStats() {
    return {
      requests: this.data.mentorshipRequests.length,
      coaches: this.data.coaches.length,
      matches: this.data.matches.length,
      companies: this.data.companies.length,
      users: this.data.users.length,
      sessions: this.data.sessions.length,
    };
  }
}

// Initialize services
const matchingService = new AdvancedMatchingService();
const db = new DatabaseService();

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-integrated-api",
    timestamp: new Date().toISOString(),
    database: db.getStats(),
    matching: {
      coaches: matchingService.getCoaches().length,
    },
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-integrated-api",
    timestamp: new Date().toISOString(),
    database: db.getStats(),
    matching: {
      coaches: matchingService.getCoaches().length,
    },
  });
});

// Mentorship/Coaching requests endpoints
app.post("/mentorship-requests", (req, res) => {
  try {
    const newRequest = db.createRequest(req.body);

    // Generate matches immediately for the new request
    const matches = matchingService.generateMatches(newRequest);
    db.saveMatches(matches);

    console.log("✅ Created new coaching request:", newRequest.id);
    res.status(201).json({
      data: newRequest,
      matches: matches.length,
    });
  } catch (error) {
    console.error("❌ Error creating request:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

app.get("/mentorship-requests", (req, res) => {
  try {
    const requests = db.getAllRequests();
    console.log("📋 Fetching all coaching requests:", requests.length);
    res.json({ data: requests });
  } catch (error) {
    console.error("❌ Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

app.get("/mentorship-requests/:id", (req, res) => {
  try {
    const request = db.getRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Also get matches for this request
    const matches = db.getMatches(req.params.id);

    console.log("📄 Fetching coaching request:", req.params.id);
    res.json({
      data: request,
      matches: matches,
    });
  } catch (error) {
    console.error("❌ Error fetching request:", error);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

app.put("/mentorship-requests/:id", (req, res) => {
  try {
    const updatedRequest = db.updateRequest(req.params.id, req.body);
    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    console.log("📝 Updated coaching request:", req.params.id);
    res.json({ data: updatedRequest });
  } catch (error) {
    console.error("❌ Error updating request:", error);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// Coaches endpoints
app.get("/coaches", (req, res) => {
  try {
    const coaches = matchingService.getCoaches();
    console.log("👥 Fetching all coaches:", coaches.length);
    res.json({ data: coaches });
  } catch (error) {
    console.error("❌ Error fetching coaches:", error);
    res.status(500).json({ error: "Failed to fetch coaches" });
  }
});

app.get("/coaches/:id", (req, res) => {
  try {
    const coaches = matchingService.getCoaches();
    const coach = coaches.find((c) => c.id === req.params.id);
    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }
    console.log("👤 Fetching coach:", req.params.id);
    res.json({ data: coach });
  } catch (error) {
    console.error("❌ Error fetching coach:", error);
    res.status(500).json({ error: "Failed to fetch coach" });
  }
});

app.post("/coaches", (req, res) => {
  try {
    const newCoach = matchingService.addCoach(req.body);
    console.log("✅ Created new coach:", newCoach.id);
    res.status(201).json({ data: newCoach });
  } catch (error) {
    console.error("❌ Error creating coach:", error);
    res.status(500).json({ error: "Failed to create coach" });
  }
});

// Advanced matching endpoints
app.post("/matching/search", (req, res) => {
  try {
    const { filters, requestId } = req.body;
    const requestData = { ...filters, id: requestId };

    const matches = matchingService.generateMatches(requestData);

    // Save matches to database
    db.saveMatches(matches);

    console.log("🔍 Generated matches for search request");
    res.json({ data: matches });
  } catch (error) {
    console.error("❌ Error generating matches:", error);
    res.status(500).json({ error: "Failed to generate matches" });
  }
});

app.get("/matching/requests/:requestId", (req, res) => {
  try {
    const matches = db.getMatches(req.params.requestId);
    console.log(
      "📊 Fetching matches for request:",
      req.params.requestId,
      "Found:",
      matches.length,
    );
    res.json({ data: matches });
  } catch (error) {
    console.error("❌ Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

// Database statistics and health
app.get("/api/v1/stats", (req, res) => {
  try {
    const stats = db.getStats();
    const dbFile = path.join(__dirname, "peptok-database.json");
    res.json({
      database: stats,
      matching: {
        coaches: matchingService.getCoaches().length,
      },
      lastSaved: fs.existsSync(dbFile) ? fs.statSync(dbFile).mtime : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log("🔄 Shutting down gracefully...");
  db.saveDatabase();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen(port, () => {
  console.log(`🚀 Peptok Integrated API running on http://localhost:${port}`);
  console.log(`📚 Health check: http://localhost:${port}/health`);
  console.log(`📊 Stats: http://localhost:${port}/api/v1/stats`);
  console.log(
    `💾 Database file: ${path.join(__dirname, "peptok-database.json")}`,
  );
  console.log(
    `🔍 Matching service: ${matchingService.getCoaches().length} coaches loaded`,
  );
});
