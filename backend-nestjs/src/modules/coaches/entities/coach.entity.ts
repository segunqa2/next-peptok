import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Session } from "../../sessions/entities/session.entity";
import { Review } from "../../reviews/entities/review.entity";
import { Match } from "../../matching/entities/match.entity";

export enum CoachStatus {
  PENDING = "pending",
  APPROVED = "approved",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
}

export enum ExpertiseLevel {
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
  EXPERT = "expert",
}

@Entity("coaches")
@Index(["status"])
@Index(["isAvailable"])
export class Coach {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User, (user) => user.coachProfile, { eager: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: CoachStatus,
    default: CoachStatus.PENDING,
  })
  status: CoachStatus;

  @Column({ type: "text" })
  bio: string;

  @Column({ type: "simple-array" })
  expertise: string[];

  @Column({ type: "simple-array" })
  industries: string[];

  @Column({ type: "simple-array" })
  languages: string[];

  @Column({
    type: "enum",
    enum: ExpertiseLevel,
    default: ExpertiseLevel.MID,
  })
  experienceLevel: ExpertiseLevel;

  @Column({ type: "int", default: 0 })
  yearsOfExperience: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  hourlyRate: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 4.5 })
  rating: number;

  @Column({ type: "int", default: 0 })
  totalReviews: number;

  @Column({ type: "int", default: 0 })
  totalSessions: number;

  @Column({ type: "boolean", default: true })
  isAvailable: boolean;

  @Column({ type: "jsonb", nullable: true })
  availability: {
    timezone: string;
    schedule: {
      [key: string]: {
        start: string;
        end: string;
        available: boolean;
      }[];
    };
  };

  @Column({ type: "jsonb", nullable: true })
  certifications: {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
    verificationUrl?: string;
  }[];

  @Column({ type: "jsonb", nullable: true })
  education: {
    degree: string;
    institution: string;
    fieldOfStudy: string;
    graduationYear: number;
  }[];

  @Column({ type: "jsonb", nullable: true })
  workExperience: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description: string;
    isCurrent: boolean;
  }[];

  @Column({ type: "jsonb", nullable: true })
  bankingDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: "checking" | "savings";
  };

  @Column({ type: "jsonb", nullable: true })
  preferences: {
    maxSessionsPerDay: number;
    maxSessionsPerWeek: number;
    minSessionDuration: number;
    maxSessionDuration: number;
    advanceBookingDays: number;
    cancellationPolicy: string;
  };

  @Column({ nullable: true })
  linkedInUrl: string;

  @Column({ nullable: true })
  portfolioUrl: string;

  @Column({ nullable: true })
  resumeUrl: string;

  @Column({ nullable: true })
  videoIntroUrl: string;

  @Column({ type: "timestamp", nullable: true })
  lastActiveAt: Date;

  @Column({ type: "boolean", default: false })
  isVerified: boolean;

  @Column({ type: "timestamp", nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: "text", nullable: true })
  adminNotes: string;

  // Relations
  @OneToMany(() => Session, (session) => session.coach)
  sessions: Session[];

  @OneToMany(() => Review, (review) => review.coach)
  reviews: Review[];

  @OneToMany(() => Match, (match) => match.coach)
  matches: Match[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get fullName(): string {
    return this.user ? this.user.fullName : "";
  }

  get email(): string {
    return this.user ? this.user.email : "";
  }

  get isActive(): boolean {
    return this.status === CoachStatus.APPROVED && this.isAvailable;
  }

  get completionRate(): number {
    // This would be calculated based on actual completion data
    return 95; // Placeholder
  }

  get responseTime(): number {
    // Average response time in hours
    return 2; // Placeholder
  }
}
