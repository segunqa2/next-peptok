import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export enum MentorshipRequestStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  MATCHED = "matched",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum GoalPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum GoalCategory {
  LEADERSHIP = "leadership",
  TECHNICAL = "technical",
  BUSINESS = "business",
  PERSONAL = "personal",
}

export interface MentorshipGoal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetMetrics?: TargetMetric[];
}

export interface TargetMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

export interface TeamMember {
  id: string;
  userId?: string;
  email: string;
  role: "participant" | "observer" | "admin";
  status: "invited" | "accepted" | "declined" | "removed";
  invitedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export class MentorshipRequest {
  @IsUUID()
  id: string;

  @IsUUID()
  companyId: string;

  @IsUUID()
  createdBy: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  description: string;

  @IsEnum(MentorshipRequestStatus)
  status: MentorshipRequestStatus = MentorshipRequestStatus.DRAFT;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredExpertise: string[] = [];

  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  sessionFrequency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metricsToTrack: string[] = [];

  @ValidateNested({ each: true })
  @Type(() => Object)
  goals: MentorshipGoal[] = [];

  @ValidateNested({ each: true })
  @Type(() => Object)
  teamMembers: TeamMember[] = [];

  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<MentorshipRequest>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  public canBeSubmitted(): boolean {
    return (
      this.status === MentorshipRequestStatus.DRAFT &&
      this.title.trim().length > 0 &&
      this.description.trim().length > 0 &&
      this.goals.length > 0 &&
      this.teamMembers.length > 0 &&
      this.metricsToTrack.length > 0
    );
  }

  public submit(): void {
    if (!this.canBeSubmitted()) {
      throw new Error("Request cannot be submitted: missing required fields");
    }
    this.status = MentorshipRequestStatus.SUBMITTED;
    this.updatedAt = new Date();
  }

  public activate(): void {
    if (this.status !== MentorshipRequestStatus.MATCHED) {
      throw new Error("Request must be matched before activation");
    }
    this.status = MentorshipRequestStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  public complete(): void {
    if (this.status !== MentorshipRequestStatus.ACTIVE) {
      throw new Error("Only active requests can be completed");
    }
    this.status = MentorshipRequestStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.status === MentorshipRequestStatus.COMPLETED) {
      throw new Error("Cannot cancel completed request");
    }
    this.status = MentorshipRequestStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  public addGoal(goal: Omit<MentorshipGoal, "id">): string {
    const newGoal: MentorshipGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.goals.push(newGoal);
    this.updatedAt = new Date();
    return newGoal.id;
  }

  public removeGoal(goalId: string): void {
    this.goals = this.goals.filter((goal) => goal.id !== goalId);
    this.updatedAt = new Date();
  }

  public addTeamMember(email: string, role: TeamMember["role"]): string {
    const existingMember = this.teamMembers.find(
      (member) => member.email === email,
    );
    if (existingMember) {
      throw new Error("Team member with this email already exists");
    }

    const newMember: TeamMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      role,
      status: "invited",
      invitedAt: new Date(),
    };

    this.teamMembers.push(newMember);
    this.updatedAt = new Date();
    return newMember.id;
  }

  public removeTeamMember(memberId: string): void {
    this.teamMembers = this.teamMembers.filter(
      (member) => member.id !== memberId,
    );
    this.updatedAt = new Date();
  }

  public acceptTeamMemberInvitation(memberId: string, userId: string): void {
    const member = this.teamMembers.find((m) => m.id === memberId);
    if (!member) {
      throw new Error("Team member not found");
    }
    if (member.status !== "invited") {
      throw new Error("Invitation is not in invited status");
    }

    member.status = "accepted";
    member.userId = userId;
    member.acceptedAt = new Date();
    this.updatedAt = new Date();
  }

  public declineTeamMemberInvitation(memberId: string): void {
    const member = this.teamMembers.find((m) => m.id === memberId);
    if (!member) {
      throw new Error("Team member not found");
    }
    if (member.status !== "invited") {
      throw new Error("Invitation is not in invited status");
    }

    member.status = "declined";
    member.declinedAt = new Date();
    this.updatedAt = new Date();
  }

  public getAcceptedMembers(): TeamMember[] {
    return this.teamMembers.filter((member) => member.status === "accepted");
  }

  public getPendingMembers(): TeamMember[] {
    return this.teamMembers.filter((member) => member.status === "invited");
  }

  public getProgress(): number {
    if (!this.startDate || !this.endDate) return 0;

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.round((elapsed / totalDuration) * 100);
  }

  public static fromDatabase(row: any): MentorshipRequest {
    return new MentorshipRequest({
      id: row.id,
      companyId: row.company_id,
      createdBy: row.created_by,
      title: row.title,
      description: row.description,
      status: row.status as MentorshipRequestStatus,
      preferredExpertise: row.preferred_expertise || [],
      budgetMin: row.budget_min,
      budgetMax: row.budget_max,
      startDate: row.start_date,
      endDate: row.end_date,
      sessionFrequency: row.session_frequency,
      metricsToTrack: row.metrics_to_track || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  public toDatabaseInsert(): Record<string, any> {
    return {
      id: this.id,
      company_id: this.companyId,
      created_by: this.createdBy,
      title: this.title,
      description: this.description,
      status: this.status,
      preferred_expertise: JSON.stringify(this.preferredExpertise),
      budget_min: this.budgetMin,
      budget_max: this.budgetMax,
      start_date: this.startDate,
      end_date: this.endDate,
      session_frequency: this.sessionFrequency,
      metrics_to_track: JSON.stringify(this.metricsToTrack),
    };
  }
}
