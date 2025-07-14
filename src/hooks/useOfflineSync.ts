// React Hook for Offline Sync
// Provides React components with offline sync capabilities

import { useState, useEffect, useCallback } from "react";
import { offlineSync, SyncStatus, SyncOperation } from "@/services/offlineSync";
import { apiEnhanced as offlineApi } from "@/services/apiEnhanced";

export interface UseOfflineSyncReturn {
  // Status
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: SyncOperation[];

  // Actions
  triggerSync: () => Promise<void>;
  clearQueue: () => void;

  // Utilities
  executeOffline: <T>(
    operation: () => Promise<T>,
    fallback?: T,
    syncOp?: Omit<SyncOperation, "id" | "timestamp" | "retryCount">,
  ) => Promise<T>;

  saveForOffline: (key: string, data: any) => void;
  getCachedData: (key: string) => any;

  // Optimistic updates
  createOptimisticUpdate: <T>(
    data: T,
    updates: Partial<T>,
    syncOp: Omit<SyncOperation, "id" | "timestamp" | "retryCount">,
  ) => T;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [status, setStatus] = useState<SyncStatus>(offlineSync.getStatus());
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(
    offlineSync.getPendingOperations(),
  );

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = offlineSync.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setPendingOperations(offlineSync.getPendingOperations());
    });

    return unsubscribe;
  }, []);

  const triggerSync = useCallback(async () => {
    await offlineSync.triggerSync();
  }, []);

  const clearQueue = useCallback(() => {
    offlineSync.clearSyncQueue();
  }, []);

  const executeOffline = useCallback(
    async <T>(
      operation: () => Promise<T>,
      fallback?: T,
      syncOp?: Omit<SyncOperation, "id" | "timestamp" | "retryCount">,
    ): Promise<T> => {
      return offlineSync.executeWithOfflineSupport(operation, fallback, syncOp);
    },
    [],
  );

  const saveForOffline = useCallback((key: string, data: any) => {
    offlineSync.saveOfflineData(key, data);
  }, []);

  const getCachedData = useCallback((key: string) => {
    return offlineSync.getOfflineData(key);
  }, []);

  const createOptimisticUpdate = useCallback(
    <T>(
      data: T,
      updates: Partial<T>,
      syncOp: Omit<SyncOperation, "id" | "timestamp" | "retryCount">,
    ): T => {
      return offlineApi.createOptimisticUpdate(data, updates, syncOp);
    },
    [],
  );

  return {
    // Status
    status,
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    pendingOperations,

    // Actions
    triggerSync,
    clearQueue,

    // Utilities
    executeOffline,
    saveForOffline,
    getCachedData,

    // Optimistic updates
    createOptimisticUpdate,
  };
}

// Hook for specific entity types with built-in caching and sync
export function useOfflineEntity<T>(
  entityKey: string,
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { executeOffline, getCachedData, saveForOffline, isOnline } =
    useOfflineSync();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get cached data first
      const cachedData = getCachedData(entityKey);
      if (cachedData && !isOnline) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data with offline support
      const result = await executeOffline(
        fetchFunction,
        cachedData, // Use cached data as fallback
      );

      setData(result);

      // Save to cache
      if (result) {
        saveForOffline(entityKey, result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");

      // Try to use cached data on error
      const cachedData = getCachedData(entityKey);
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setLoading(false);
    }
  }, [
    entityKey,
    fetchFunction,
    executeOffline,
    getCachedData,
    saveForOffline,
    isOnline,
  ]);

  useEffect(() => {
    loadData();
  }, dependencies);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const updateData = useCallback(
    (updates: Partial<T>) => {
      if (data) {
        const updatedData = { ...data, ...updates };
        setData(updatedData);
        saveForOffline(entityKey, updatedData);
      }
    },
    [data, entityKey, saveForOffline],
  );

  return {
    data,
    loading,
    error,
    refresh,
    updateData,
  };
}

// Hook for offline-first operations
export function useOfflineOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { executeOffline } = useOfflineSync();

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      options?: {
        fallback?: T;
        syncOperation?: Omit<SyncOperation, "id" | "timestamp" | "retryCount">;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
      },
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await executeOffline(
          operation,
          options?.fallback,
          options?.syncOperation,
        );

        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Operation failed");
        setError(error.message);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [executeOffline],
  );

  return {
    execute,
    loading,
    error,
    clearError: () => setError(null),
  };
}

export default useOfflineSync;
