export interface MentorExpertise {
  id: string;
  category: string;
  subcategory: string;
  yearsExperience: number;
  level: "beginner" | "intermediate" | "expert" | "master";
}

export interface MentorAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export enum MentorStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BUSY = "busy",
  UNAVAILABLE = "unavailable",
}

export interface MentorMetrics {
  totalSessions: number;
  averageRating: number;
  totalStudents: number;
  successRate: number;
  responseTime: number; // in hours
  completionRate: number;
}

export class Mentor {
  constructor(
    public id: string,
    public userId: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public profilePicture?: string,
    public bio?: string,
    public title?: string,
    public company?: string,
    public linkedinUrl?: string,
    public expertise: MentorExpertise[] = [],
    public availability: MentorAvailability[] = [],
    public hourlyRate?: number,
    public currency: string = "USD",
    public status: MentorStatus = MentorStatus.ACTIVE,
    public metrics: MentorMetrics = {
      totalSessions: 0,
      averageRating: 0,
      totalStudents: 0,
      successRate: 0,
      responseTime: 24,
      completionRate: 0,
    },
    public languages: string[] = ["English"],
    public maxStudentsPerMonth: number = 10,
    public isVerified: boolean = false,
    public joinedAt: Date = new Date(),
    public lastActiveAt: Date = new Date(),
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public isAvailable(): boolean {
    return this.status === MentorStatus.ACTIVE;
  }

  public canAcceptNewStudents(): boolean {
    return (
      this.isAvailable() &&
      this.metrics.totalStudents < this.maxStudentsPerMonth
    );
  }

  public getExpertiseCategories(): string[] {
    return [...new Set(this.expertise.map((exp) => exp.category))];
  }

  public getMatchScore(requiredSkills: string[], goals: string[]): number {
    // Simple matching algorithm - can be enhanced with AI
    const mentorSkills = this.expertise.map((exp) =>
      exp.category.toLowerCase(),
    );
    const requiredSkillsLower = requiredSkills.map((skill) =>
      skill.toLowerCase(),
    );

    let score = 0;

    // Skill matching (60% weight)
    const skillMatches = requiredSkillsLower.filter((skill) =>
      mentorSkills.some(
        (mentorSkill) =>
          mentorSkill.includes(skill) || skill.includes(mentorSkill),
      ),
    );
    score += (skillMatches.length / requiredSkillsLower.length) * 0.6;

    // Experience level (20% weight)
    const avgExperience =
      this.expertise.reduce((sum, exp) => sum + exp.yearsExperience, 0) /
      this.expertise.length;
    score += Math.min(avgExperience / 10, 1) * 0.2;

    // Ratings and success rate (20% weight)
    score += (this.metrics.averageRating / 5) * 0.1;
    score += this.metrics.successRate * 0.1;

    return Math.round(score * 100);
  }

  public updateMetrics(newMetrics: Partial<MentorMetrics>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
    this.updatedAt = new Date();
  }

  public addExpertise(expertise: MentorExpertise): void {
    this.expertise.push(expertise);
    this.updatedAt = new Date();
  }

  public updateAvailability(availability: MentorAvailability[]): void {
    this.availability = availability;
    this.updatedAt = new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      profilePicture: this.profilePicture,
      bio: this.bio,
      title: this.title,
      company: this.company,
      linkedinUrl: this.linkedinUrl,
      expertise: this.expertise,
      availability: this.availability,
      hourlyRate: this.hourlyRate,
      currency: this.currency,
      status: this.status,
      metrics: this.metrics,
      languages: this.languages,
      maxStudentsPerMonth: this.maxStudentsPerMonth,
      isVerified: this.isVerified,
      joinedAt: this.joinedAt,
      lastActiveAt: this.lastActiveAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
