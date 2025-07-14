// Offline Sync Service
// Handles offline capabilities and automatic syncing to backend

import { toast } from "sonner";
import { apiEnhanced } from "./apiEnhanced";
import { analytics } from "./analytics";

export interface SyncOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  data?: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: "high" | "medium" | "low";
  entityType: string;
  entityId?: string;
  originalId?: string; // For optimistic updates
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime?: string;
  syncInProgress: boolean;
  failedOperations: number;
}

export interface ConflictResolution {
  strategy: "server-wins" | "client-wins" | "merge" | "manual";
  resolver?: (serverData: any, clientData: any) => any;
}

class OfflineSyncService {
  private readonly QUEUE_KEY = "peptok_sync_queue";
  private readonly SYNC_STATUS_KEY = "peptok_sync_status";
  private readonly OFFLINE_DATA_KEY = "peptok_offline_data";

  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInProgress: boolean = false;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private conflictResolvers: Map<string, ConflictResolution> = new Map();

  private retryDelays = [1000, 3000, 5000, 10000, 30000]; // Progressive retry delays

  constructor() {
    this.initializeOfflineSupport();
    this.loadSyncQueue();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private initializeOfflineSupport() {
    // Register service worker for background sync
    if ("serviceWorker" in navigator) {
      this.registerServiceWorker();
    }

    // Setup conflict resolution strategies
    this.setupDefaultConflictResolvers();

    console.log("Offline sync service initialized");
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      // Listen for sync events
      if (registration.sync) {
        registration.sync.register("background-sync");
      }
    } catch (error) {
      console.warn("Service Worker registration failed:", error);
    }
  }

  private setupDefaultConflictResolvers() {
    // Default conflict resolution strategies
    this.conflictResolvers.set("mentorship_requests", {
      strategy: "server-wins",
    });

    this.conflictResolvers.set("team_invitations", {
      strategy: "client-wins", // Prefer local changes for invitations
    });

    this.conflictResolvers.set("user_profiles", {
      strategy: "merge",
      resolver: (serverData, clientData) => ({
        ...serverData,
        ...clientData,
        updatedAt: Math.max(
          new Date(serverData.updatedAt).getTime(),
          new Date(clientData.updatedAt).getTime(),
        ),
      }),
    });
  }

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.triggerSync();
      toast.success("🌐 Back online - syncing data...", { duration: 3000 });
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyStatusChange();
      toast.info("📱 Offline mode - changes will sync when reconnected", {
        duration: 5000,
      });
    });

    // Visibility change for sync on app focus
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isOnline) {
        this.triggerSync();
      }
    });
  }

  private startPeriodicSync() {
    // Periodic sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.triggerSync();
      }
    }, 30000);
  }

  // Public API

  /**
   * Add operation to sync queue
   */
  public queueOperation(
    operation: Omit<SyncOperation, "id" | "timestamp" | "retryCount">,
  ): string {
    const syncOp: SyncOperation = {
      ...operation,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: operation.maxRetries || 5,
    };

    this.syncQueue.push(syncOp);
    this.saveSyncQueue();
    this.notifyStatusChange();

    console.log("Queued sync operation:", syncOp);

    // Try immediate sync if online
    if (this.isOnline) {
      this.triggerSync();
    }

    return syncOp.id;
  }

  /**
   * Execute operation with offline support
   */
  public async executeWithOfflineSupport<T>(
    operation: () => Promise<T>,
    fallbackData?: T,
    syncOperation?: Omit<SyncOperation, "id" | "timestamp" | "retryCount">,
  ): Promise<T> {
    try {
      if (this.isOnline) {
        const result = await operation();
        return result;
      } else {
        // Queue for sync when online
        if (syncOperation) {
          this.queueOperation(syncOperation);
        }

        if (fallbackData) {
          return fallbackData;
        }

        throw new Error("Operation unavailable offline");
      }
    } catch (error) {
      console.warn("Operation failed, queuing for sync:", error);

      if (syncOperation) {
        this.queueOperation(syncOperation);
      }

      if (fallbackData) {
        return fallbackData;
      }

      throw error;
    }
  }

  /**
   * Trigger manual sync
   */
  public async triggerSync(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.syncInProgress = true;
    this.notifyStatusChange();

    try {
      console.log(`Starting sync of ${this.syncQueue.length} operations`);

      // Sort by priority and timestamp
      const sortedQueue = [...this.syncQueue].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      const results = await this.processSyncQueue(sortedQueue);

      // Remove successfully synced operations
      const successfulIds = results
        .filter((r) => r.success)
        .map((r) => r.operationId);
      this.syncQueue = this.syncQueue.filter(
        (op) => !successfulIds.includes(op.id),
      );

      // Update retry counts for failed operations
      const failedOps = results.filter((r) => !r.success);
      failedOps.forEach((failed) => {
        const op = this.syncQueue.find((o) => o.id === failed.operationId);
        if (op) {
          op.retryCount++;
          if (op.retryCount >= op.maxRetries) {
            console.error("Max retries reached for operation:", op);
            this.syncQueue = this.syncQueue.filter((o) => o.id !== op.id);
          }
        }
      });

      this.saveSyncQueue();

      const successCount = successfulIds.length;
      const failedCount = failedOps.length;

      if (successCount > 0) {
        toast.success(
          `✅ Synced ${successCount} operation${successCount > 1 ? "s" : ""}`,
          {
            duration: 3000,
          },
        );

        analytics.trackAction({
          action: "sync_completed",
          component: "offline_sync",
          metadata: { successCount, failedCount },
        });
      }

      if (failedCount > 0) {
        console.warn(`${failedCount} operations failed to sync`);
      }

      // Update last sync time
      localStorage.setItem(
        this.SYNC_STATUS_KEY,
        JSON.stringify({
          lastSyncTime: new Date().toISOString(),
          failedOperations: this.syncQueue.length,
        }),
      );
    } catch (error) {
      console.error("Sync process failed:", error);
      toast.error("Sync failed - will retry automatically");
    } finally {
      this.isSyncing = false;
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  private async processSyncQueue(
    operations: SyncOperation[],
  ): Promise<Array<{ operationId: string; success: boolean; error?: any }>> {
    const results: Array<{
      operationId: string;
      success: boolean;
      error?: any;
    }> = [];

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        results.push({ operationId: operation.id, success: true });
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        results.push({ operationId: operation.id, success: false, error });

        // Progressive delay for retries
        if (operation.retryCount < this.retryDelays.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelays[operation.retryCount]),
          );
        }
      }
    }

    return results;
  }

  private async executeOperation(operation: SyncOperation): Promise<any> {
    const { endpoint, method, data } = operation;

    console.log(`Executing sync operation: ${method} ${endpoint}`);

    const requestOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "DELETE") {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Save data for offline access
   */
  public saveOfflineData(key: string, data: any): void {
    try {
      const offlineData = this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error("Failed to save offline data:", error);
    }
  }

  /**
   * Get offline data
   */
  public getOfflineData(key?: string): any {
    try {
      const offlineData = JSON.parse(
        localStorage.getItem(this.OFFLINE_DATA_KEY) || "{}",
      );
      return key ? offlineData[key]?.data : offlineData;
    } catch (error) {
      console.error("Failed to get offline data:", error);
      return key ? null : {};
    }
  }

  /**
   * Clear offline data
   */
  public clearOfflineData(key?: string): void {
    try {
      if (key) {
        const offlineData = this.getOfflineData();
        delete offlineData[key];
        localStorage.setItem(
          this.OFFLINE_DATA_KEY,
          JSON.stringify(offlineData),
        );
      } else {
        localStorage.removeItem(this.OFFLINE_DATA_KEY);
      }
    } catch (error) {
      console.error("Failed to clear offline data:", error);
    }
  }

  /**
   * Get current sync status
   */
  public getStatus(): SyncStatus {
    const savedStatus = localStorage.getItem(this.SYNC_STATUS_KEY);
    const { lastSyncTime, failedOperations } = savedStatus
      ? JSON.parse(savedStatus)
      : {};

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.syncQueue.length,
      lastSyncTime,
      syncInProgress: this.syncInProgress,
      failedOperations: failedOperations || 0,
    };
  }

  /**
   * Subscribe to status changes
   */
  public onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Clear sync queue
   */
  public clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
    this.notifyStatusChange();
    toast.success("Sync queue cleared");
  }

  /**
   * Get pending operations
   */
  public getPendingOperations(): SyncOperation[] {
    return [...this.syncQueue];
  }

  /**
   * Set conflict resolution strategy
   */
  public setConflictResolver(
    entityType: string,
    resolution: ConflictResolution,
  ): void {
    this.conflictResolvers.set(entityType, resolution);
  }

  // Private helper methods

  private loadSyncQueue(): void {
    try {
      const saved = localStorage.getItem(this.QUEUE_KEY);
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        console.log(
          `Loaded ${this.syncQueue.length} pending operations from storage`,
        );
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  }

  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error("Status listener error:", error);
      }
    });
  }

  /**
   * Reset service (for testing/debugging)
   */
  public reset(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
    this.clearOfflineData();
    localStorage.removeItem(this.SYNC_STATUS_KEY);
    this.notifyStatusChange();
    console.log("Offline sync service reset");
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService();
export default offlineSync;
