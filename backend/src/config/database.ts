import { Pool, PoolConfig } from "pg";
import { logger } from "./logger.js";

interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
  ];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "20", 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "5000",
      10,
    ),
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  };
};

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    const config = getDatabaseConfig();
    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on("error", (err) => {
      logger.error("Unexpected database pool error:", err);
    });

    this.pool.on("connect", () => {
      logger.info("New database connection established");
    });

    this.pool.on("remove", () => {
      logger.info("Database connection removed from pool");
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      logger.info("Database connection test successful");
    } catch (error) {
      logger.error("Database connection test failed:", error);
      throw error;
    }
  }

  public async closePool(): Promise<void> {
    try {
      await this.pool.end();
      logger.info("Database pool closed successfully");
    } catch (error) {
      logger.error("Error closing database pool:", error);
      throw error;
    }
  }

  public async executeQuery<T = any>(
    query: string,
    params?: any[],
  ): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error("Database query error:", { query, params, error });
      throw error;
    } finally {
      client.release();
    }
  }

  public async executeTransaction<T>(
    callback: (client: any) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Transaction error:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const db = DatabaseConnection.getInstance();
export default db;
