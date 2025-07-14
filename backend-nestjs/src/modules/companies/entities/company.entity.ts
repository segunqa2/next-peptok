import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Session } from "../../sessions/entities/session.entity";

import { MatchingRequest } from "../../matching/entities/matching-request.entity";

export enum CompanyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  TRIAL = "trial",
}

export enum SubscriptionTier {
  STARTER = "starter",
  GROWTH = "growth",
  ENTERPRISE = "enterprise",
}

@Entity("companies")
@Index(["email"], { unique: true })
export class Company {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column()
  industry: string;

  @Column({ type: "int", default: 0 })
  employeeCount: number;

  @Column({ type: "jsonb", nullable: true })
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  @Column({
    type: "enum",
    enum: CompanyStatus,
    default: CompanyStatus.TRIAL,
  })
  status: CompanyStatus;

  @Column({
    type: "enum",
    enum: SubscriptionTier,
    default: SubscriptionTier.STARTER,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  monthlyBudget: number;

  @Column({ type: "int", default: 2 })
  maxUsers: number;

  @Column({ type: "int", default: 200 })
  monthlyMentorMinutes: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ nullable: true })
  subscriptionStartDate: Date;

  @Column({ nullable: true })
  subscriptionEndDate: Date;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: "jsonb", nullable: true })
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  @Column({ type: "jsonb", nullable: true })
  settings: {
    allowEmployeeInvites: boolean;
    requireApprovalForSessions: boolean;
    maxSessionDuration: number;
    defaultTimezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      slack: boolean;
    };
  };

  // Relations
  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Session, (session) => session.company)
  sessions: Session[];

  @OneToMany(() => MatchingRequest, (request) => request.company)
  matchingRequests: MatchingRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isTrialExpired(): boolean {
    if (this.status !== CompanyStatus.TRIAL) return false;
    if (!this.subscriptionEndDate) return false;
    return new Date() > this.subscriptionEndDate;
  }

  get remainingMentorMinutes(): number {
    // This would be calculated based on usage
    return this.monthlyMentorMinutes;
  }

  get canAddMoreUsers(): boolean {
    return this.users?.length < this.maxUsers;
  }
}
