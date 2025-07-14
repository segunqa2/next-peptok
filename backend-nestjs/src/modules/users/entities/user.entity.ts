import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Coach } from "../../coaches/entities/coach.entity";
import { Company } from "../../companies/entities/company.entity";
import { Session } from "../../sessions/entities/session.entity";
import { Review } from "../../reviews/entities/review.entity";

export enum UserRole {
  ADMIN = "admin",
  ENTERPRISE = "enterprise",
  COACH = "coach",
  EMPLOYEE = "employee",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
}

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  GITHUB = "github",
}

@Entity("users")
@Index(["email"], { unique: true })
@Index(["username"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({
    type: "enum",
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  githubId: string;

  @Column({ type: "boolean", default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: "jsonb", nullable: true })
  preferences: Record<string, any>;

  // Relations
  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: "companyId" })
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @OneToOne(() => Coach, (coach) => coach.user)
  coachProfile: Coach;

  @OneToMany(() => Session, (session) => session.employee)
  employeeSessions: Session[];

  @OneToMany(() => Session, (session) => session.coach)
  coachSessions: Session[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviewsGiven: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isCoach(): boolean {
    return this.role === UserRole.COACH;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isEnterprise(): boolean {
    return this.role === UserRole.ENTERPRISE;
  }
}
