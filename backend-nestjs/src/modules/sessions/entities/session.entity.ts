import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Coach } from "../../coaches/entities/coach.entity";
import { Company } from "../../companies/entities/company.entity";

import { Review } from "../../reviews/entities/review.entity";

export enum SessionStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum SessionType {
  ONE_ON_ONE = "one_on_one",
  GROUP = "group",
  WORKSHOP = "workshop",
}

@Entity("sessions")
@Index(["status"])
@Index(["scheduledAt"])
@Index(["coachId"])
@Index(["employeeId"])
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: SessionType,
    default: SessionType.ONE_ON_ONE,
  })
  type: SessionType;

  @Column({
    type: "enum",
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Column({ type: "timestamp" })
  scheduledAt: Date;

  @Column({ type: "int", default: 60 })
  durationMinutes: number;

  @Column({ type: "timestamp", nullable: true })
  actualStartTime: Date;

  @Column({ type: "timestamp", nullable: true })
  actualEndTime: Date;

  @Column({ type: "simple-array", nullable: true })
  objectives: string[];

  @Column({ type: "text", nullable: true })
  agenda: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "simple-array", nullable: true })
  tags: string[];

  @Column({ type: "jsonb", nullable: true })
  meetingDetails: {
    platform: "zoom" | "teams" | "google_meet" | "in_person";
    meetingUrl?: string;
    meetingId?: string;
    password?: string;
    location?: string;
  };

  @Column({ type: "decimal", precision: 10, scale: 2 })
  coachRate: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  serviceCharge: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  commission: number;

  @Column({ type: "int", default: 1 })
  participantCount: number;

  @Column({ type: "int", default: 0 })
  additionalParticipants: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  additionalParticipantFee: number;

  @Column({ type: "text", nullable: true })
  cancellationReason: string;

  @Column({ type: "timestamp", nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ type: "jsonb", nullable: true })
  feedback: {
    coachFeedback?: string;
    employeeFeedback?: string;
    adminNotes?: string;
  };

  // Relations
  @ManyToOne(() => Coach, (coach) => coach.sessions, { eager: true })
  @JoinColumn({ name: "coachId" })
  coach: Coach;

  @Column()
  coachId: string;

  @ManyToOne(() => User, (user) => user.employeeSessions, { eager: true })
  @JoinColumn({ name: "employeeId" })
  employee: User;

  @Column()
  employeeId: string;

  @ManyToOne(() => Company, (company) => company.sessions)
  @JoinColumn({ name: "companyId" })
  company: Company;

  @Column()
  companyId: string;

  @OneToMany(() => Review, (review) => review.session)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get duration(): number {
    if (this.actualStartTime && this.actualEndTime) {
      return Math.round(
        (this.actualEndTime.getTime() - this.actualStartTime.getTime()) /
          (1000 * 60),
      );
    }
    return this.durationMinutes;
  }

  get isUpcoming(): boolean {
    return (
      this.status === SessionStatus.SCHEDULED && this.scheduledAt > new Date()
    );
  }

  get isPast(): boolean {
    return (
      this.status === SessionStatus.COMPLETED ||
      (this.scheduledAt < new Date() &&
        this.status !== SessionStatus.IN_PROGRESS)
    );
  }

  get canBeCancelled(): boolean {
    const hoursUntilSession =
      (this.scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return (
      this.status === SessionStatus.SCHEDULED && hoursUntilSession >= 24 // 24 hours cancellation policy
    );
  }

  get totalEarnings(): number {
    return this.serviceCharge + this.commission;
  }
}
