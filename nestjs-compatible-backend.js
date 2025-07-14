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

// Enhanced Database Service
class NestJSDatabaseService {
  constructor() {
    this.dbPath = path.join(process.cwd(), "nestjs-database.json");
    this.data = {
      coachingRequests: [],
      coaches: this.getInitialCoaches(),
      matches: [],
      companies: [],
      users: [],
      sessions: [],
    };
    this.loadDatabase();
  }

  getInitialCoaches() {
    return [
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  loadDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileData = fs.readFileSync(this.dbPath, "utf8");
        const loadedData = JSON.parse(fileData);
        this.data = { ...this.data, ...loadedData };
        console.log("📁 NestJS Database loaded from file");
      }
    } catch (error) {
      console.warn("⚠️ Could not load database file:", error.message);
    }
  }

  saveDatabase() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
      console.log("💾 NestJS Database saved to file");
    } catch (error) {
      console.error("❌ Could not save database:", error.message);
    }
  }

  async createCoachingRequest(requestData) {
    const newRequest = {
      id: `request_${Date.now()}`,
      ...requestData,
      status: requestData.status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.coachingRequests.push(newRequest);
    this.saveDatabase();

    console.log("✅ Created coaching request:", newRequest.id);
    return newRequest;
  }

  async getAllCoachingRequests() {
    return this.data.coachingRequests;
  }

  async getCoachingRequest(id) {
    return this.data.coachingRequests.find((request) => request.id === id);
  }

  async updateCoachingRequest(id, updateData) {
    const index = this.data.coachingRequests.findIndex(
      (request) => request.id === id,
    );
    if (index === -1) return null;

    this.data.coachingRequests[index] = {
      ...this.data.coachingRequests[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    this.saveDatabase();
    console.log("📝 Updated coaching request:", id);
    return this.data.coachingRequests[index];
  }

  async getAllCoaches() {
    return this.data.coaches;
  }

  async getCoach(id) {
    return this.data.coaches.find((coach) => coach.id === id);
  }

  async createCoach(coachData) {
    const newCoach = {
      id: `coach_${Date.now()}`,
      ...coachData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.coaches.push(newCoach);
    this.saveDatabase();

    console.log("✅ Created coach:", newCoach.id);
    return newCoach;
  }

  async saveMatches(matches) {
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
    console.log("💾 Saved matches:", matches.length);
  }

  async getMatches(requestId) {
    return this.data.matches.filter((match) => match.requestId === requestId);
  }

  getStats() {
    return {
      coachingRequests: this.data.coachingRequests.length,
      coaches: this.data.coaches.length,
      matches: this.data.matches.length,
      companies: this.data.companies.length,
      users: this.data.users.length,
      sessions: this.data.sessions.length,
    };
  }
}

// Enhanced Matching Service
class NestJSMatchingService {
  constructor(databaseService) {
    this.databaseService = databaseService;
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
          return;
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

  async generateMatches(requestData) {
    const coaches = await this.databaseService.getAllCoaches();
    const requiredExpertise =
      requestData.expertise || requestData.goals?.map((g) => g.title) || [];
    const requiredExperience = requestData.experience || "5+ years";
    const requestId = requestData.id || `request_${Date.now()}`;

    const matches = coaches.map((coach) => {
      const expertiseScore = this.calculateExpertiseScore(
        coach.expertise,
        requiredExpertise,
      );
      const experienceScore = this.calculateExperienceScore(
        coach.experience,
        requiredExperience,
      );
      const ratingScore = this.calculateRatingScore(coach.rating);

      const finalScore = Math.max(
        expertiseScore * 0.5 + experienceScore * 0.3 + ratingScore * 0.2,
        0.3,
      );

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

    matches.sort((a, b) => b.matchScore - a.matchScore);
    await this.databaseService.saveMatches(matches);

    console.log(
      `🔍 Generated ${matches.length} matches for request ${requestId}`,
    );
    return matches;
  }

  async getMatchesForRequest(requestId) {
    return this.databaseService.getMatches(requestId);
  }
}

// Initialize services
const databaseService = new NestJSDatabaseService();
const matchingService = new NestJSMatchingService(databaseService);

// Health check endpoints - Compatible with NestJS pattern
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-nestjs-compatible-api",
    timestamp: new Date().toISOString(),
    database: databaseService.getStats(),
    matching: {
      coaches: databaseService.data.coaches.length,
    },
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-nestjs-compatible-api",
    timestamp: new Date().toISOString(),
    database: databaseService.getStats(),
    matching: {
      coaches: databaseService.data.coaches.length,
    },
  });
});

// Coaching Requests - NestJS-compatible routes with /api/v1 prefix
app.post("/api/v1/mentorship-requests", async (req, res) => {
  try {
    const newRequest = await databaseService.createCoachingRequest(req.body);

    // Generate matches immediately
    const matches = await matchingService.generateMatches({
      id: newRequest.id,
      expertise: newRequest.goals?.map((g) => g.title),
      goals: newRequest.goals,
      experience: "5+ years",
    });

    console.log("✅ Created coaching request with matches:", newRequest.id);
    res.status(201).json({
      data: newRequest,
      matches: matches.length,
    });
  } catch (error) {
    console.error("❌ Error creating coaching request:", error);
    res.status(500).json({ error: "Failed to create coaching request" });
  }
});

app.get("/api/v1/mentorship-requests", async (req, res) => {
  try {
    const requests = await databaseService.getAllCoachingRequests();
    console.log("📋 Fetching all coaching requests:", requests.length);
    res.json({ data: requests });
  } catch (error) {
    console.error("❌ Error fetching coaching requests:", error);
    res.status(500).json({ error: "Failed to fetch coaching requests" });
  }
});

app.get("/api/v1/mentorship-requests/:id", async (req, res) => {
  try {
    const request = await databaseService.getCoachingRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const matches = await matchingService.getMatchesForRequest(req.params.id);

    console.log("📄 Fetching coaching request:", req.params.id);
    res.json({
      data: request,
      matches: matches,
    });
  } catch (error) {
    console.error("❌ Error fetching coaching request:", error);
    res.status(500).json({ error: "Failed to fetch coaching request" });
  }
});

app.put("/api/v1/mentorship-requests/:id", async (req, res) => {
  try {
    const updatedRequest = await databaseService.updateCoachingRequest(
      req.params.id,
      req.body,
    );
    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    console.log("📝 Updated coaching request:", req.params.id);
    res.json({ data: updatedRequest });
  } catch (error) {
    console.error("❌ Error updating coaching request:", error);
    res.status(500).json({ error: "Failed to update coaching request" });
  }
});

// Coaches endpoints
app.get("/api/v1/coaches", async (req, res) => {
  try {
    const coaches = await databaseService.getAllCoaches();
    console.log("👥 Fetching all coaches:", coaches.length);
    res.json({ data: coaches });
  } catch (error) {
    console.error("❌ Error fetching coaches:", error);
    res.status(500).json({ error: "Failed to fetch coaches" });
  }
});

app.get("/api/v1/coaches/:id", async (req, res) => {
  try {
    const coach = await databaseService.getCoach(req.params.id);
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

app.post("/api/v1/coaches", async (req, res) => {
  try {
    const newCoach = await databaseService.createCoach(req.body);
    console.log("✅ Created coach:", newCoach.id);
    res.status(201).json({ data: newCoach });
  } catch (error) {
    console.error("❌ Error creating coach:", error);
    res.status(500).json({ error: "Failed to create coach" });
  }
});

// Matching endpoints
app.post("/api/v1/matching/search", async (req, res) => {
  try {
    const { filters, requestId } = req.body;
    const requestData = {
      id: requestId || `search_${Date.now()}`,
      ...filters,
    };

    const matches = await matchingService.generateMatches(requestData);

    console.log("🔍 Generated matches for search");
    res.json({ data: matches });
  } catch (error) {
    console.error("❌ Error generating matches:", error);
    res.status(500).json({ error: "Failed to generate matches" });
  }
});

app.get("/api/v1/matching/requests/:requestId", async (req, res) => {
  try {
    const matches = await matchingService.getMatchesForRequest(
      req.params.requestId,
    );
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

// Database statistics
app.get("/api/v1/stats", (req, res) => {
  try {
    const stats = databaseService.getStats();
    res.json({
      database: stats,
      matching: {
        coaches: databaseService.data.coaches.length,
      },
      lastSaved: fs.existsSync(databaseService.dbPath)
        ? fs.statSync(databaseService.dbPath).mtime
        : null,
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
  databaseService.saveDatabase();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen(port, () => {
  console.log(
    `🚀 Peptok NestJS-Compatible API running on http://localhost:${port}`,
  );
  console.log(`📚 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`📊 Stats: http://localhost:${port}/api/v1/stats`);
  console.log(`💾 Database file: ${databaseService.dbPath}`);
  console.log(
    `🔍 Matching service: ${databaseService.data.coaches.length} coaches loaded`,
  );
  console.log(`🎯 All endpoints use /api/v1 prefix for NestJS compatibility`);
});
