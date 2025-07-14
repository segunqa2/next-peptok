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
import { Coach } from "../../coaches/entities/coach.entity";

export enum MatchStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

@Entity("matches")
@Index(["status"])
@Index(["score"])
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  participant: User;

  @Column()
  participantId: string;

  @ManyToOne(() => Coach, (coach) => coach.matches, { eager: true })
  @JoinColumn()
  coach: Coach;

  @Column()
  coachId: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  score: number;

  @Column({
    type: "enum",
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column({ type: "jsonb", nullable: true })
  matchingCriteria: {
    skillsMatch: number;
    experienceMatch: number;
    industryMatch: number;
    availabilityMatch: number;
    languageMatch: number;
    cultureMatch: number;
  };

  @Column({ type: "jsonb", nullable: true })
  reasons: string[];

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date;

  @Column({ type: "timestamp", nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
