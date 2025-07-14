// Backend Storage Service
// Replaces ALL localStorage operations with backend database calls

import { toast } from "sonner";
import { databaseConfig } from "./databaseConfig";

export interface BackendStorageOptions {
  userId?: string;
  companyId?: string;
  sessionId?: string;
  encrypted?: boolean;
  expiresAt?: string;
  tags?: string[];
}

export interface StoredData {
  id: string;
  key: string;
  value: any;
  userId?: string;
  companyId?: string;
  sessionId?: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  tags?: string[];
}

class BackendStorageService {
  private readonly STORAGE_ENDPOINTS = [
    "/api/storage",
    "/api/user-data",
    "/storage",
  ];

  private readonly AUTH_ENDPOINTS = [
    "/api/auth/sessions",
    "/api/sessions",
    "/auth/sessions",
  ];

  private readonly USER_ENDPOINTS = [
    "/api/users",
    "/api/user-profiles",
    "/users",
  ];

  constructor() {
    console.log(
      "🗃️ Backend Storage Service initialized - NO localStorage usage",
    );
  }

  /**
   * Store data in backend database (replaces localStorage.setItem)
   */
  async setItem(
    key: string,
    value: any,
    options: BackendStorageOptions = {},
  ): Promise<boolean> {
    try {
      console.log(`🗃️ Storing data to backend database: ${key}`);

      // Verify database connection
      if (!databaseConfig.isDatabaseReady()) {
        throw new Error("Backend database not available");
      }

      const storageData = {
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
        userId: options.userId,
        companyId: options.companyId,
        sessionId: options.sessionId,
        encrypted: options.encrypted || false,
        expiresAt: options.expiresAt,
        tags: options.tags || [],
        requiresDatabaseStorage: true,
      };

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            endpoint,
            "POST",
            storageData,
          );

          if (response.success && response.data?.id) {
            console.log(
              `✅ Data stored in backend database: ${key} (ID: ${response.data.id})`,
            );
            return true;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to store data in backend database");
    } catch (error) {
      console.error(
        `❌ Failed to store data in backend database: ${key}`,
        error,
      );
      toast.error("❌ Failed to save data to database", {
        description: `Could not save ${key}`,
        duration: 5000,
      });
      return false;
    }
  }

  /**
   * Retrieve data from backend database (replaces localStorage.getItem)
   */
  async getItem(
    key: string,
    options: BackendStorageOptions = {},
  ): Promise<string | null> {
    try {
      console.log(`🗃️ Retrieving data from backend database: ${key}`);

      // Verify database connection
      if (!databaseConfig.isDatabaseReady()) {
        throw new Error("Backend database not available");
      }

      const queryParams = new URLSearchParams({
        key,
        ...(options.userId && { userId: options.userId }),
        ...(options.companyId && { companyId: options.companyId }),
        ...(options.sessionId && { sessionId: options.sessionId }),
      });

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}?${queryParams.toString()}`,
            "GET",
          );

          if (response.success && response.data) {
            const storedData = response.data;

            // Check if expired
            if (
              storedData.expiresAt &&
              new Date() > new Date(storedData.expiresAt)
            ) {
              await this.removeItem(key, options);
              return null;
            }

            console.log(`✅ Data retrieved from backend database: ${key}`);
            return storedData.value;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      console.log(`ℹ️ Data not found in backend database: ${key}`);
      return null;
    } catch (error) {
      console.error(
        `❌ Failed to retrieve data from backend database: ${key}`,
        error,
      );
      return null;
    }
  }

  /**
   * Remove data from backend database (replaces localStorage.removeItem)
   */
  async removeItem(
    key: string,
    options: BackendStorageOptions = {},
  ): Promise<boolean> {
    try {
      console.log(`🗃️ Removing data from backend database: ${key}`);

      const queryParams = new URLSearchParams({
        key,
        ...(options.userId && { userId: options.userId }),
        ...(options.companyId && { companyId: options.companyId }),
        ...(options.sessionId && { sessionId: options.sessionId }),
      });

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}?${queryParams.toString()}`,
            "DELETE",
          );

          if (response.success) {
            console.log(`✅ Data removed from backend database: ${key}`);
            return true;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to remove data from backend database");
    } catch (error) {
      console.error(
        `❌ Failed to remove data from backend database: ${key}`,
        error,
      );
      return false;
    }
  }

  /**
   * Clear all data for user/company from backend database (replaces localStorage.clear)
   */
  async clear(options: BackendStorageOptions = {}): Promise<boolean> {
    try {
      console.log("🗃️ Clearing data from backend database");

      const queryParams = new URLSearchParams({
        action: "clear",
        ...(options.userId && { userId: options.userId }),
        ...(options.companyId && { companyId: options.companyId }),
        ...(options.sessionId && { sessionId: options.sessionId }),
      });

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}/clear?${queryParams.toString()}`,
            "DELETE",
          );

          if (response.success) {
            console.log("✅ Data cleared from backend database");
            return true;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to clear data from backend database");
    } catch (error) {
      console.error("❌ Failed to clear data from backend database", error);
      return false;
    }
  }

  /**
   * Get all keys for user/company from backend database
   */
  async keys(options: BackendStorageOptions = {}): Promise<string[]> {
    try {
      console.log("🗃️ Getting keys from backend database");

      const queryParams = new URLSearchParams({
        action: "keys",
        ...(options.userId && { userId: options.userId }),
        ...(options.companyId && { companyId: options.companyId }),
        ...(options.sessionId && { sessionId: options.sessionId }),
      });

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}/keys?${queryParams.toString()}`,
            "GET",
          );

          if (response.success && Array.isArray(response.data)) {
            console.log(
              `✅ Retrieved ${response.data.length} keys from backend database`,
            );
            return response.data;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to get keys from backend database");
    } catch (error) {
      console.error("❌ Failed to get keys from backend database", error);
      return [];
    }
  }

  /**
   * Store user session in backend database (replaces auth localStorage)
   */
  async storeUserSession(user: any, token: string): Promise<boolean> {
    try {
      console.log("🗃️ Storing user session in backend database");

      const sessionData = {
        userId: user.id,
        userType: user.userType,
        email: user.email,
        name: user.name,
        token,
        companyId: user.companyId,
        loginAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        requiresDatabaseStorage: true,
      };

      for (const endpoint of this.AUTH_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            endpoint,
            "POST",
            sessionData,
          );

          if (response.success && response.data?.sessionId) {
            console.log(
              `✅ User session stored in backend database: ${response.data.sessionId}`,
            );

            // Also store user profile
            await this.storeUserProfile(user);

            return true;
          }
        } catch (error) {
          console.warn(`Auth endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to store user session in backend database");
    } catch (error) {
      console.error(
        "❌ Failed to store user session in backend database",
        error,
      );
      return false;
    }
  }

  /**
   * Retrieve user session from backend database
   */
  async getUserSession(userId?: string, token?: string): Promise<any | null> {
    try {
      console.log("🗃️ Retrieving user session from backend database");

      const queryParams = new URLSearchParams({
        ...(userId && { userId }),
        ...(token && { token }),
      });

      for (const endpoint of this.AUTH_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}?${queryParams.toString()}`,
            "GET",
          );

          if (response.success && response.data) {
            const session = response.data;

            // Check if session expired
            if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
              await this.clearUserSession(userId, token);
              return null;
            }

            console.log("✅ User session retrieved from backend database");
            return session;
          }
        } catch (error) {
          console.warn(`Auth endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(
        "❌ Failed to retrieve user session from backend database",
        error,
      );
      return null;
    }
  }

  /**
   * Clear user session from backend database
   */
  async clearUserSession(userId?: string, token?: string): Promise<boolean> {
    try {
      console.log("🗃️ Clearing user session from backend database");

      const queryParams = new URLSearchParams({
        action: "logout",
        ...(userId && { userId }),
        ...(token && { token }),
      });

      for (const endpoint of this.AUTH_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}?${queryParams.toString()}`,
            "DELETE",
          );

          if (response.success) {
            console.log("✅ User session cleared from backend database");
            return true;
          }
        } catch (error) {
          console.warn(`Auth endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to clear user session from backend database");
    } catch (error) {
      console.error(
        "❌ Failed to clear user session from backend database",
        error,
      );
      return false;
    }
  }

  /**
   * Store user profile in backend database
   */
  async storeUserProfile(user: any): Promise<boolean> {
    try {
      console.log("🗃️ Storing user profile in backend database");

      const profileData = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        companyId: user.companyId,
        businessDetails: user.businessDetails,
        picture: user.picture,
        provider: user.provider,
        isAuthenticated: user.isAuthenticated,
        updatedAt: new Date().toISOString(),
        requiresDatabaseStorage: true,
      };

      for (const endpoint of this.USER_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            endpoint,
            "POST",
            profileData,
          );

          if (response.success && response.data?.id) {
            console.log(
              `✅ User profile stored in backend database: ${response.data.id}`,
            );
            return true;
          }
        } catch (error) {
          console.warn(`User endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to store user profile in backend database");
    } catch (error) {
      console.error(
        "❌ Failed to store user profile in backend database",
        error,
      );
      return false;
    }
  }

  /**
   * Batch operations for multiple data items
   */
  async batchSet(
    items: Array<{ key: string; value: any; options?: BackendStorageOptions }>,
  ): Promise<boolean> {
    try {
      console.log(`🗃️ Batch storing ${items.length} items to backend database`);

      const batchData = {
        operation: "batch_set",
        items: items.map((item) => ({
          key: item.key,
          value:
            typeof item.value === "string"
              ? item.value
              : JSON.stringify(item.value),
          ...item.options,
        })),
        requiresDatabaseStorage: true,
      };

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}/batch`,
            "POST",
            batchData,
          );

          if (response.success) {
            console.log(
              `✅ Batch stored ${items.length} items to backend database`,
            );
            return true;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error("Failed to batch store data in backend database");
    } catch (error) {
      console.error("❌ Failed to batch store data in backend database", error);
      return false;
    }
  }

  /**
   * Search data in backend database
   */
  async search(
    pattern: string,
    options: BackendStorageOptions = {},
  ): Promise<StoredData[]> {
    try {
      console.log(`🗃️ Searching backend database for: ${pattern}`);

      const queryParams = new URLSearchParams({
        pattern,
        ...(options.userId && { userId: options.userId }),
        ...(options.companyId && { companyId: options.companyId }),
        ...(options.tags && { tags: options.tags.join(",") }),
      });

      for (const endpoint of this.STORAGE_ENDPOINTS) {
        try {
          const response = await databaseConfig.makeDatabaseRequest(
            `${endpoint}/search?${queryParams.toString()}`,
            "GET",
          );

          if (response.success && Array.isArray(response.data)) {
            console.log(
              `✅ Found ${response.data.length} items in backend database`,
            );
            return response.data;
          }
        } catch (error) {
          console.warn(`Storage endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      return [];
    } catch (error) {
      console.error("❌ Failed to search backend database", error);
      return [];
    }
  }
}

// Export singleton instance
export const backendStorage = new BackendStorageService();
export default backendStorage;
