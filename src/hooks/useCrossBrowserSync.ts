// React Hook for Cross-Browser Synchronization
// Makes it easy to use cross-browser sync in any component

import { useEffect, useState, useCallback } from "react";
import { crossBrowserSync, SyncConfig } from "@/services/crossBrowserSync";
import { useAuth } from "@/contexts/AuthContext";

export interface UseCrossBrowserSyncOptions {
  syncConfig: SyncConfig;
  autoLoad?: boolean;
  onSync?: (data: any) => void;
}

export function useCrossBrowserSync<T>(options: UseCrossBrowserSyncOptions) {
  const { syncConfig, autoLoad = true, onSync } = options;
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Load data from cross-browser storage
  const loadData = useCallback(() => {
    try {
      setIsLoading(true);
      const loadedData = crossBrowserSync.load(syncConfig);
      setData(loadedData);
      setLastSyncTime(new Date().toLocaleString());
      return loadedData;
    } catch (error) {
      console.warn(`Error loading ${syncConfig.storageKey}:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [syncConfig]);

  // Save data to cross-browser storage
  const saveData = useCallback(
    (newData: T) => {
      if (!user) {
        console.warn("Cannot save data: user not authenticated");
        return false;
      }

      try {
        crossBrowserSync.save(syncConfig, newData, {
          id: user.id,
          name: user.name,
        });
        setData(newData);
        setLastSyncTime(new Date().toLocaleString());
        return true;
      } catch (error) {
        console.warn(`Error saving ${syncConfig.storageKey}:`, error);
        return false;
      }
    },
    [syncConfig, user],
  );

  // Update specific field in the data
  const updateData = useCallback(
    (updater: (currentData: T | null) => T) => {
      const newData = updater(data);
      return saveData(newData);
    },
    [data, saveData],
  );

  // Initialize sync and subscribe to updates
  useEffect(() => {
    // Register the sync configuration
    crossBrowserSync.register(syncConfig);

    // Subscribe to updates from other browsers/tabs
    const unsubscribe = crossBrowserSync.subscribe(
      syncConfig.storageKey,
      (syncedData) => {
        setData(syncedData);
        setLastSyncTime(new Date().toLocaleString());
        if (onSync) {
          onSync(syncedData);
        }
      },
    );

    // Auto-load data if enabled
    if (autoLoad) {
      loadData();
    }

    return unsubscribe;
  }, [syncConfig, autoLoad, loadData, onSync]);

  return {
    data,
    isLoading,
    lastSyncTime,
    loadData,
    saveData,
    updateData,
    isConnected: !!user,
  };
}

// Specialized hooks for common data types
export function usePricingConfigSync() {
  return useCrossBrowserSync({
    syncConfig: {
      storageKey: "peptok_platform_global_config",
      cookieKey: "peptok_config",
      broadcastChannel: "peptok_config_sync",
      syncInterval: 5000,
    },
  });
}

export function useUserManagementSync() {
  return useCrossBrowserSync({
    syncConfig: {
      storageKey: "peptok_user_management",
      cookieKey: "peptok_users",
      broadcastChannel: "peptok_users_sync",
      syncInterval: 7000,
    },
  });
}

export function useCompanyManagementSync() {
  return useCrossBrowserSync({
    syncConfig: {
      storageKey: "peptok_company_management",
      cookieKey: "peptok_companies",
      broadcastChannel: "peptok_companies_sync",
      syncInterval: 8000,
    },
  });
}

// Global sync status hook
export function useSyncStatus() {
  const [status, setStatus] = useState({
    activeChannels: [] as string[],
    syncIntervals: [] as string[],
    listeners: [] as string[],
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus(crossBrowserSync.getStatus());
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return status;
}
