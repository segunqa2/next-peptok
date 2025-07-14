import { User, UserType, UserStatus } from "@/models/User.js";

export interface IUserReader {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByOAuth(provider: string, oauthId: string): Promise<User | null>;
  findMany(filters: UserFilters): Promise<User[]>;
  exists(email: string): Promise<boolean>;
  count(filters?: Partial<UserFilters>): Promise<number>;
}

export interface IUserWriter {
  create(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: UserStatus): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  markAsVerified(id: string): Promise<void>;
}

export interface UserFilters {
  userType?: UserType;
  status?: UserStatus;
  search?: string;
  companyId?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "last_login_at" | "email";
  sortOrder?: "ASC" | "DESC";
}

export interface IUserRepository extends IUserReader, IUserWriter {
  // Combined interface for repositories that need both read and write operations
}
