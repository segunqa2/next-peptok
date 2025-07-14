import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { User, UserStatus } from "@/models/User.js";
import { IUserRepository, UserFilters } from "./interfaces/IUserRepository.js";
import { logger } from "@/config/logger.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return User.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error("Error finding user by ID:", { id, error });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const result = await this.db.query(query, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        return null;
      }

      return User.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error("Error finding user by email:", { email, error });
      throw error;
    }
  }

  async findByOAuth(provider: string, oauthId: string): Promise<User | null> {
    try {
      const query =
        "SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2";
      const result = await this.db.query(query, [provider, oauthId]);

      if (result.rows.length === 0) {
        return null;
      }

      return User.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error("Error finding user by OAuth:", {
        provider,
        oauthId,
        error,
      });
      throw error;
    }
  }

  async findMany(filters: UserFilters): Promise<User[]> {
    try {
      let query = "SELECT u.* FROM users u";
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Join with company_users if filtering by company
      if (filters.companyId) {
        query += " INNER JOIN company_users cu ON u.id = cu.user_id";
        conditions.push(`cu.company_id = $${paramIndex}`);
        params.push(filters.companyId);
        paramIndex++;
      }

      // Add filters
      if (filters.userType) {
        conditions.push(`u.user_type = $${paramIndex}`);
        params.push(filters.userType);
        paramIndex++;
      }

      if (filters.status) {
        conditions.push(`u.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.search) {
        conditions.push(
          `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`,
        );
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Add WHERE clause if conditions exist
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      // Add sorting
      const sortBy = filters.sortBy || "created_at";
      const sortOrder = filters.sortOrder || "DESC";
      query += ` ORDER BY u.${sortBy} ${sortOrder}`;

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await this.db.query(query, params);
      return result.rows.map((row) => User.fromDatabase(row));
    } catch (error) {
      logger.error("Error finding users with filters:", { filters, error });
      throw error;
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const query = "SELECT 1 FROM users WHERE email = $1";
      const result = await this.db.query(query, [email.toLowerCase()]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error("Error checking if user exists:", { email, error });
      throw error;
    }
  }

  async count(filters?: Partial<UserFilters>): Promise<number> {
    try {
      let query = "SELECT COUNT(*) FROM users u";
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.companyId) {
        query += " INNER JOIN company_users cu ON u.id = cu.user_id";
        conditions.push(`cu.company_id = $${paramIndex}`);
        params.push(filters.companyId);
        paramIndex++;
      }

      if (filters?.userType) {
        conditions.push(`u.user_type = $${paramIndex}`);
        params.push(filters.userType);
        paramIndex++;
      }

      if (filters?.status) {
        conditions.push(`u.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      const result = await this.db.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error("Error counting users:", { filters, error });
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    try {
      if (!user.id) {
        user.id = uuidv4();
      }

      const data = user.toDatabaseInsert();
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const query = `
        INSERT INTO users (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return User.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error("Error creating user:", { user: user.email, error });
      throw error;
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const setClause: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Build SET clause dynamically
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== "id") {
          // Convert camelCase to snake_case for database columns
          const dbColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          setClause.push(`${dbColumn} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error("No valid fields to update");
      }

      // Always update the updated_at field
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE users 
        SET ${setClause.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      params.push(id);

      const result = await this.db.query(query, params);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      return User.fromDatabase(result.rows[0]);
    } catch (error) {
      logger.error("Error updating user:", { id, updates, error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = "DELETE FROM users WHERE id = $1";
      const result = await this.db.query(query, [id]);

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      logger.error("Error deleting user:", { id, error });
      throw error;
    }
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    try {
      const query =
        "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2";
      const result = await this.db.query(query, [status, id]);

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      logger.error("Error updating user status:", { id, status, error });
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const query =
        "UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1";
      const result = await this.db.query(query, [id]);

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      logger.error("Error updating last login:", { id, error });
      throw error;
    }
  }

  async markAsVerified(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET email_verified_at = CURRENT_TIMESTAMP, 
            status = $1, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `;
      const result = await this.db.query(query, [UserStatus.ACTIVE, id]);

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      logger.error("Error marking user as verified:", { id, error });
      throw error;
    }
  }
}
