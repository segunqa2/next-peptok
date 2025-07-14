import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

export interface CoachingRequest {
  id: string;
  title: string;
  description: string;
  companyId: string;
  status: string;
  goals?: Array<{ id: string; title: string; description: string }>;
  teamMembers?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  timeline?: {
    startDate: string;
    endDate: string;
    sessionFrequency: string;
  };
  metricsToTrack?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Coach {
  id: string;
  name: string;
  expertise: string[];
  experience: string;
  rating: number;
  bio: string;
  hourlyRate: number;
  availability: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  coachId: string;
  requestId: string;
  matchScore: number;
  reason: string;
  createdAt: string;
}

interface DatabaseSchema {
  coachingRequests: CoachingRequest[];
  coaches: Coach[];
  matches: Match[];
  companies: any[];
  users: any[];
  sessions: any[];
}

@Injectable()
export class DatabaseService {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    this.dbPath = path.join(process.cwd(), "nestjs-database.json");
    this.initializeDatabase();
  }

  private initializeDatabase() {
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

  private getInitialCoaches(): Coach[] {
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

  private loadDatabase() {
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

  private saveDatabase() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
      console.log("💾 NestJS Database saved to file");
    } catch (error) {
      console.error("❌ Could not save database:", error.message);
    }
  }

  // Coaching Requests
  async createCoachingRequest(
    requestData: Partial<CoachingRequest>,
  ): Promise<CoachingRequest> {
    const newRequest: CoachingRequest = {
      id: `request_${Date.now()}`,
      ...requestData,
      status: requestData.status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as CoachingRequest;

    this.data.coachingRequests.push(newRequest);
    this.saveDatabase();

    console.log("✅ Created coaching request:", newRequest.id);
    return newRequest;
  }

  async getAllCoachingRequests(): Promise<CoachingRequest[]> {
    return this.data.coachingRequests;
  }

  async getCoachingRequest(id: string): Promise<CoachingRequest | null> {
    return (
      this.data.coachingRequests.find((request) => request.id === id) || null
    );
  }

  async updateCoachingRequest(
    id: string,
    updateData: Partial<CoachingRequest>,
  ): Promise<CoachingRequest | null> {
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

  // Coaches
  async getAllCoaches(): Promise<Coach[]> {
    return this.data.coaches;
  }

  async getCoach(id: string): Promise<Coach | null> {
    return this.data.coaches.find((coach) => coach.id === id) || null;
  }

  async createCoach(coachData: Partial<Coach>): Promise<Coach> {
    const newCoach: Coach = {
      id: `coach_${Date.now()}`,
      ...coachData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Coach;

    this.data.coaches.push(newCoach);
    this.saveDatabase();

    console.log("✅ Created coach:", newCoach.id);
    return newCoach;
  }

  // Matches
  async saveMatches(matches: Match[]): Promise<void> {
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

  async getMatches(requestId: string): Promise<Match[]> {
    return this.data.matches.filter((match) => match.requestId === requestId);
  }

  // Statistics
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

  getDatabasePath(): string {
    return this.dbPath;
  }
}
