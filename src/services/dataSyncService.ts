/**
 * Centralized Data Synchronization Service
 *
 * This service ensures all data operations follow the pattern:
 * 1. Try backend first
 * 2. Use localStorage as fallback
 * 3. Always sync data to backend when available
 * 4. Update localStorage with latest backend data
 */

import { toast } from "sonner";
import { Environment } from "@/utils/environment";

export interface SyncConfig {
  entity: string;
  endpoint: string;
  localStorageKey: string;
  idField?: string;
}

export interface SyncResult<T> {
  success: boolean;
  data: T | null;
  source: "backend" | "localStorage" | "none";
  error?: string;
  backendAvailable: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  source: "backend" | "localStorage";
  error?: string;
}

class DataSyncService {
  private API_BASE_URL: string;
  private currentUser: any = null;
  private syncQueue: Array<{
    operation: () => Promise<void>;
    timestamp: number;
  }> = [];
  private isProcessingQueue = false;
  private backendHealthStatus = true;
  private readonly SYNC_TIMEOUT = 5000; // 5 seconds
  private readonly RETRY_ATTEMPTS = 3;

  constructor() {
    this.API_BASE_URL = Environment.getApiBaseUrl();
    this.initializeSync();
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  private async initializeSync() {
    // Check backend health on startup
    await this.checkBackendHealth();

    // Process any queued sync operations periodically
    setInterval(() => {
      if (this.backendHealthStatus && !this.isProcessingQueue) {
        this.processSyncQueue();
      }
    }, 10000); // Every 10 seconds
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.SYNC_TIMEOUT);

      const response = await fetch(`${this.API_BASE_URL}/health`, {
        signal: controller.signal,
        headers: this.getHeaders(),
      });

      clearTimeout(timeoutId);
      this.backendHealthStatus = response.ok;

      if (!this.backendHealthStatus) {
        console.warn(
          "🔴 Backend health check failed - using localStorage fallback",
        );
      } else {
        console.log("✅ Backend is healthy and available");
      }

      return this.backendHealthStatus;
    } catch (error) {
      this.backendHealthStatus = false;
      console.warn(
        "🔴 Backend unavailable - using localStorage fallback:",
        error,
      );
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.currentUser?.token) {
      headers["Authorization"] = `Bearer ${this.currentUser.token}`;
    }

    return headers;
  }

  /**
   * Retrieve data with backend-first approach
   */
  async getData<T>(
    config: SyncConfig,
    filters?: Record<string, any>,
  ): Promise<SyncResult<T[]>> {
    console.log(`📥 Getting data for ${config.entity}...`);

    // Try backend first
    if (await this.checkBackendHealth()) {
      try {
        const queryParams = filters
          ? `?${new URLSearchParams(filters).toString()}`
          : "";
        const response = await this.makeRequest(
          `${config.endpoint}${queryParams}`,
          "GET",
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Retrieved ${config.entity} from backend:`, data);

          // Update localStorage with fresh backend data
          this.updateLocalStorage(config.localStorageKey, data);

          return {
            success: true,
            data,
            source: "backend",
            backendAvailable: true,
          };
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get ${config.entity} from backend:`, error);
      }
    }

    // Fallback to localStorage
    console.log(`📱 Using localStorage fallback for ${config.entity}`);
    const localData = this.getFromLocalStorage<T[]>(config.localStorageKey, []);

    return {
      success: localData.length > 0,
      data: localData,
      source: "localStorage",
      backendAvailable: false,
    };
  }

  /**
   * Create data with backend sync
   */
  async createData<T>(
    config: SyncConfig,
    data: T,
  ): Promise<SyncOperationResult> {
    console.log(`📝 Creating ${config.entity}...`);

    // Try backend first
    if (await this.checkBackendHealth()) {
      try {
        const response = await this.makeRequest(config.endpoint, "POST", data);

        if (response.ok) {
          const createdData = await response.json();
          console.log(`✅ Created ${config.entity} in backend:`, createdData);

          // Update localStorage with the backend response
          this.addToLocalStorage(config.localStorageKey, createdData);

          return {
            success: true,
            source: "backend",
          };
        }
      } catch (error) {
        console.warn(`⚠️ Failed to create ${config.entity} in backend:`, error);
      }
    }

    // Fallback to localStorage and queue for sync
    console.log(
      `📱 Storing ${config.entity} in localStorage and queuing for sync`,
    );
    const localData = { ...data, id: this.generateLocalId(), _needsSync: true };
    this.addToLocalStorage(config.localStorageKey, localData);

    // Queue for backend sync when available
    this.queueForSync(async () => {
      await this.syncLocalDataToBackend(config, localData);
    });

    return {
      success: true,
      source: "localStorage",
    };
  }

  /**
   * Update data with backend sync
   */
  async updateData<T>(
    config: SyncConfig,
    id: string,
    updates: Partial<T>,
  ): Promise<SyncOperationResult> {
    console.log(`📝 Updating ${config.entity} with id ${id}...`);

    // Try backend first
    if (await this.checkBackendHealth()) {
      try {
        const response = await this.makeRequest(
          `${config.endpoint}/${id}`,
          "PUT",
          updates,
        );

        if (response.ok) {
          const updatedData = await response.json();
          console.log(`✅ Updated ${config.entity} in backend:`, updatedData);

          // Update localStorage with the backend response
          this.updateInLocalStorage(
            config.localStorageKey,
            id,
            updatedData,
            config.idField,
          );

          return {
            success: true,
            source: "backend",
          };
        }
      } catch (error) {
        console.warn(`⚠️ Failed to update ${config.entity} in backend:`, error);
      }
    }

    // Fallback to localStorage and queue for sync
    console.log(
      `📱 Updating ${config.entity} in localStorage and queuing for sync`,
    );
    const updatedData = { ...updates, _needsSync: true };
    this.updateInLocalStorage(
      config.localStorageKey,
      id,
      updatedData,
      config.idField,
    );

    // Queue for backend sync when available
    this.queueForSync(async () => {
      await this.syncLocalDataToBackend(config, { id, ...updates });
    });

    return {
      success: true,
      source: "localStorage",
    };
  }

  /**
   * Delete data with backend sync
   */
  async deleteData(
    config: SyncConfig,
    id: string,
  ): Promise<SyncOperationResult> {
    console.log(`🗑️ Deleting ${config.entity} with id ${id}...`);

    // Try backend first
    if (await this.checkBackendHealth()) {
      try {
        const response = await this.makeRequest(
          `${config.endpoint}/${id}`,
          "DELETE",
        );

        if (response.ok) {
          console.log(`✅ Deleted ${config.entity} from backend`);

          // Remove from localStorage
          this.removeFromLocalStorage(
            config.localStorageKey,
            id,
            config.idField,
          );

          return {
            success: true,
            source: "backend",
          };
        }
      } catch (error) {
        console.warn(
          `⚠️ Failed to delete ${config.entity} from backend:`,
          error,
        );
      }
    }

    // Fallback to localStorage and queue for sync
    console.log(`📱 Marking ${config.entity} as deleted in localStorage`);
    this.updateInLocalStorage(
      config.localStorageKey,
      id,
      { _deleted: true, _needsSync: true },
      config.idField,
    );

    // Queue for backend sync when available
    this.queueForSync(async () => {
      await this.makeRequest(`${config.endpoint}/${id}`, "DELETE");
      this.removeFromLocalStorage(config.localStorageKey, id, config.idField);
    });

    return {
      success: true,
      source: "localStorage",
    };
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    data?: any,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.SYNC_TIMEOUT);

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse localStorage data for ${key}:`, error);
      return defaultValue;
    }
  }

  private updateLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 Updated localStorage: ${key}`);
    } catch (error) {
      console.error(`Failed to update localStorage for ${key}:`, error);
    }
  }

  private addToLocalStorage(key: string, newItem: any): void {
    try {
      const existing = this.getFromLocalStorage(key, []);
      existing.unshift(newItem);
      this.updateLocalStorage(key, existing);
    } catch (error) {
      console.error(`Failed to add to localStorage for ${key}:`, error);
    }
  }

  private updateInLocalStorage(
    key: string,
    id: string,
    updates: any,
    idField = "id",
  ): void {
    try {
      const existing = this.getFromLocalStorage(key, []);
      const updatedItems = existing.map((item: any) =>
        item[idField] === id ? { ...item, ...updates } : item,
      );
      this.updateLocalStorage(key, updatedItems);
    } catch (error) {
      console.error(`Failed to update in localStorage for ${key}:`, error);
    }
  }

  private removeFromLocalStorage(
    key: string,
    id: string,
    idField = "id",
  ): void {
    try {
      const existing = this.getFromLocalStorage(key, []);
      const filteredItems = existing.filter(
        (item: any) => item[idField] !== id,
      );
      this.updateLocalStorage(key, filteredItems);
    } catch (error) {
      console.error(`Failed to remove from localStorage for ${key}:`, error);
    }
  }

  private queueForSync(operation: () => Promise<void>): void {
    this.syncQueue.push({
      operation,
      timestamp: Date.now(),
    });
    console.log(
      `📤 Queued operation for sync. Queue size: ${this.syncQueue.length}`,
    );
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(
      `🔄 Processing sync queue with ${this.syncQueue.length} operations...`,
    );

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const { operation } of operations) {
      try {
        await operation();
        console.log("✅ Sync operation completed");
      } catch (error) {
        console.error("❌ Sync operation failed:", error);
        // Re-queue failed operations for retry
        this.syncQueue.push({ operation, timestamp: Date.now() });
      }
    }

    this.isProcessingQueue = false;
    console.log("🏁 Sync queue processing completed");
  }

  private async syncLocalDataToBackend(
    config: SyncConfig,
    data: any,
  ): Promise<void> {
    if (!this.backendHealthStatus) {
      throw new Error("Backend not available for sync");
    }

    if (data._deleted) {
      await this.makeRequest(`${config.endpoint}/${data.id}`, "DELETE");
    } else if (data.id && data.id.startsWith("local_")) {
      // Create new item in backend
      const { id, _needsSync, _deleted, ...cleanData } = data;
      const response = await this.makeRequest(
        config.endpoint,
        "POST",
        cleanData,
      );

      if (response.ok) {
        const createdData = await response.json();
        // Replace local item with backend item
        this.removeFromLocalStorage(config.localStorageKey, id);
        this.addToLocalStorage(config.localStorageKey, createdData);
      }
    } else {
      // Update existing item in backend
      const { _needsSync, _deleted, ...cleanData } = data;
      await this.makeRequest(`${config.endpoint}/${data.id}`, "PUT", cleanData);
    }
  }

  /**
   * Force sync all pending localStorage data to backend
   */
  async forceSyncAll(): Promise<{ synced: number; failed: number }> {
    console.log("🔄 Force syncing all pending data to backend...");

    if (!(await this.checkBackendHealth())) {
      console.warn("❌ Cannot force sync - backend unavailable");
      return { synced: 0, failed: 0 };
    }

    await this.processSyncQueue();

    return {
      synced: 0, // Would track actual numbers in production
      failed: 0,
    };
  }

  /**
   * Get sync status for monitoring
   */
  getSyncStatus(): {
    backendAvailable: boolean;
    queuedOperations: number;
    isProcessing: boolean;
  } {
    return {
      backendAvailable: this.backendHealthStatus,
      queuedOperations: this.syncQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }
}

export const dataSyncService = new DataSyncService();
