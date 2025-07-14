import {
  IsString,
  IsOptional,
  IsUUID,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface CompanySettings {
  allowPublicProfile: boolean;
  requireTwoFactor: boolean;
  sessionReminders: boolean;
  weeklyReports: boolean;
  customBranding: boolean;
}

export class Company {
  @IsUUID()
  id: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @Transform(({ value }) => value?.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
  slug: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  address?: CompanyAddress;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  settings: CompanySettings;

  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Company>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.settings = this.settings || this.getDefaultSettings();
  }

  private getDefaultSettings(): CompanySettings {
    return {
      allowPublicProfile: true,
      requireTwoFactor: false,
      sessionReminders: true,
      weeklyReports: true,
      customBranding: false,
    };
  }

  public updateProfile(
    updates: Partial<
      Pick<
        Company,
        | "name"
        | "industry"
        | "size"
        | "website"
        | "description"
        | "logoUrl"
        | "address"
      >
    >,
  ): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();

    // Update slug if name changed
    if (updates.name) {
      this.slug = this.generateSlug(updates.name);
    }
  }

  public updateSettings(newSettings: Partial<CompanySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updatedAt = new Date();
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  public static fromDatabase(row: any): Company {
    return new Company({
      id: row.id,
      name: row.name,
      slug: row.slug,
      industry: row.industry,
      size: row.size,
      website: row.website,
      description: row.description,
      logoUrl: row.logo_url,
      address: row.address ? JSON.parse(row.address) : undefined,
      settings: row.settings ? JSON.parse(row.settings) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  public toDatabaseInsert(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      industry: this.industry,
      size: this.size,
      website: this.website,
      description: this.description,
      logo_url: this.logoUrl,
      address: this.address ? JSON.stringify(this.address) : null,
      settings: JSON.stringify(this.settings),
    };
  }
}
