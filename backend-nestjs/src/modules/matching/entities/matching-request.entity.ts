import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Company } from "../../companies/entities/company.entity";

export enum MatchingRequestStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum MatchingRequestPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

@Entity("matching_requests")
@Index(["status"])
@Index(["priority"])
export class MatchingRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  requester: User;

  @Column()
  requesterId: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn()
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @Column({
    type: "enum",
    enum: MatchingRequestStatus,
    default: MatchingRequestStatus.PENDING,
  })
  status: MatchingRequestStatus;

  @Column({
    type: "enum",
    enum: MatchingRequestPriority,
    default: MatchingRequestPriority.MEDIUM,
  })
  priority: MatchingRequestPriority;

  @Column({ type: "simple-array" })
  requiredSkills: string[];

  @Column({ type: "simple-array" })
  preferredIndustries: string[];

  @Column({ type: "simple-array" })
  languages: string[];

  @Column({ type: "jsonb", nullable: true })
  preferences: {
    experienceLevel: string;
    sessionFrequency: string;
    sessionDuration: number;
    budget: {
      min: number;
      max: number;
      currency: string;
    };
    timezone: string;
    availability: {
      [key: string]: {
        start: string;
        end: string;
        available: boolean;
      }[];
    };
  };

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  goals: string;

  @Column({ type: "int", default: 5 })
  maxCoaches: number;

  @Column({ type: "timestamp", nullable: true })
  deadline: Date;

  @Column({ type: "timestamp", nullable: true })
  processedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @Column({ type: "text", nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
