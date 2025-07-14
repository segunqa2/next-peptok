import { Company } from "@/models/Company.js";

export interface ICompanyReader {
  findById(id: string): Promise<Company | null>;
  findBySlug(slug: string): Promise<Company | null>;
  findMany(filters: CompanyFilters): Promise<Company[]>;
  exists(slug: string): Promise<boolean>;
  count(filters?: Partial<CompanyFilters>): Promise<number>;
}

export interface ICompanyWriter {
  create(company: Company): Promise<Company>;
  update(id: string, updates: Partial<Company>): Promise<Company>;
  delete(id: string): Promise<void>;
  updateSettings(id: string, settings: any): Promise<void>;
}

export interface CompanyFilters {
  industry?: string;
  size?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "name";
  sortOrder?: "ASC" | "DESC";
}

export interface ICompanyRepository extends ICompanyReader, ICompanyWriter {}
