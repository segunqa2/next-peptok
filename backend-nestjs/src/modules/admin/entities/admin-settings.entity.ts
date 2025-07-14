import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("admin_settings")
@Index(["key"], { unique: true })
export class AdminSettings {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: "jsonb" })
  value: any;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", default: "system" })
  category: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("service_charges")
export class ServiceCharge {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  tierName: string;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  serviceChargePercentage: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  commissionPercentage: number;

  @Column({ type: "int", default: 1 })
  maxParticipantsIncluded: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  additionalParticipantFee: number;

  @Column({ type: "int", default: 60 })
  defaultSessionDurationMinutes: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  minimumSessionFee: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  calculateServiceCharge(coachRate: number, durationMinutes: number): number {
    const baseAmount = (coachRate * durationMinutes) / 60;
    const serviceCharge = (baseAmount * this.serviceChargePercentage) / 100;
    return Math.max(serviceCharge, this.minimumSessionFee);
  }

  calculateCommission(coachRate: number, durationMinutes: number): number {
    const baseAmount = (coachRate * durationMinutes) / 60;
    return (baseAmount * this.commissionPercentage) / 100;
  }

  calculateAdditionalParticipantCost(additionalParticipants: number): number {
    return additionalParticipants * this.additionalParticipantFee;
  }

  calculateTotalSessionCost(
    coachRate: number,
    durationMinutes: number,
    additionalParticipants: number = 0,
  ): {
    coachAmount: number;
    serviceCharge: number;
    commission: number;
    additionalParticipantFee: number;
    totalAmount: number;
    platformEarnings: number;
  } {
    const coachAmount = (coachRate * durationMinutes) / 60;
    const serviceCharge = this.calculateServiceCharge(
      coachRate,
      durationMinutes,
    );
    const commission = this.calculateCommission(coachRate, durationMinutes);
    const additionalParticipantFee = this.calculateAdditionalParticipantCost(
      additionalParticipants,
    );

    const totalAmount = coachAmount + serviceCharge + additionalParticipantFee;
    const platformEarnings = serviceCharge + commission;

    return {
      coachAmount,
      serviceCharge,
      commission,
      additionalParticipantFee,
      totalAmount,
      platformEarnings,
    };
  }
}
