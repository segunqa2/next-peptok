// Centralized Cross-Browser Synchronization Service
// Ensures all platform admins see the same data across different browsers

import { toast } from "sonner";

export interface SyncData {
  type: string;
  data: any;
  timestamp: string;
  updatedBy: string;
  updatedByName: string;
  syncToken: string;
}

export interface SyncConfig {
  storageKey: string;
  cookieKey: string;
  broadcastChannel: string;
  syncInterval?: number;
}

class CrossBrowserSyncService {
  private activeChannels: Map<string, BroadcastChannel> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Register a data type for cross-browser synchronization
   */
  register(config: SyncConfig) {
    const { broadcastChannel, syncInterval = 5000 } = config;

    // Setup BroadcastChannel for real-time sync
    if (
      typeof BroadcastChannel !== "undefined" &&
      !this.activeChannels.has(broadcastChannel)
    ) {
      const channel = new BroadcastChannel(broadcastChannel);
      this.activeChannels.set(broadcastChannel, channel);

      channel.addEventListener("message", (event) => {
        const { type, data, updatedByName } = event.data;
        this.notifyListeners(type, data);

        if (updatedByName) {
          toast.info(
            `${type} updated by ${updatedByName} in different browser`,
          );
        }
      });
    }

    // Setup periodic sync for cross-browser updates
    if (!this.syncIntervals.has(config.storageKey)) {
      const intervalId = setInterval(() => {
        this.checkForUpdates(config);
      }, syncInterval);

      this.syncIntervals.set(config.storageKey, intervalId);
    }
  }

  /**
   * Save data with cross-browser synchronization
   */
  save(config: SyncConfig, data: any, userInfo: { id: string; name: string }) {
    const syncData: SyncData = {
      type: config.storageKey,
      data,
      timestamp: new Date().toISOString(),
      updatedBy: userInfo.id,
      updatedByName: userInfo.name,
      syncToken: Date.now().toString(),
    };

    // Save to localStorage
    localStorage.setItem(config.storageKey, JSON.stringify(syncData));

    // Save to cookie for cross-browser access
    this.setCrossBrowserData(config.cookieKey, syncData);

    // Broadcast to other tabs/windows
    this.broadcast(config.broadcastChannel, syncData);

    console.log(
      `✅ ${config.storageKey} saved and synchronized across browsers`,
    );
    return syncData;
  }

  /**
   * Load data with cross-browser sync check
   */
  load(config: SyncConfig): any | null {
    try {
      // Get from localStorage
      const localData = localStorage.getItem(config.storageKey);

      // Get from cross-browser storage
      const crossBrowserData = this.getCrossBrowserData(config.cookieKey);

      let finalData = null;

      if (localData && crossBrowserData) {
        const local = JSON.parse(localData);
        // Use newer data based on timestamp
        if (new Date(crossBrowserData.timestamp) > new Date(local.timestamp)) {
          finalData = crossBrowserData;
          // Update localStorage with newer data
          localStorage.setItem(
            config.storageKey,
            JSON.stringify(crossBrowserData),
          );
          console.log(
            `🔄 Synced newer ${config.storageKey} from cross-browser storage`,
          );
        } else {
          finalData = local;
        }
      } else if (crossBrowserData) {
        finalData = crossBrowserData;
        localStorage.setItem(
          config.storageKey,
          JSON.stringify(crossBrowserData),
        );
      } else if (localData) {
        finalData = JSON.parse(localData);
      }

      return finalData?.data || null;
    } catch (error) {
      console.warn(`Error loading ${config.storageKey}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to data changes
   */
  subscribe(dataType: string, callback: (data: any) => void) {
    if (!this.listeners.has(dataType)) {
      this.listeners.set(dataType, new Set());
    }
    this.listeners.get(dataType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(dataType)?.delete(callback);
    };
  }

  /**
   * Check for updates from other browsers
   */
  private checkForUpdates(config: SyncConfig) {
    try {
      const localData = localStorage.getItem(config.storageKey);
      const crossBrowserData = this.getCrossBrowserData(config.cookieKey);

      if (localData && crossBrowserData) {
        const local = JSON.parse(localData);

        if (crossBrowserData.syncToken !== local.syncToken) {
          // Data was updated by another browser
          localStorage.setItem(
            config.storageKey,
            JSON.stringify(crossBrowserData),
          );
          this.notifyListeners(config.storageKey, crossBrowserData.data);
        }
      } else if (crossBrowserData && !localData) {
        // New data from another browser
        localStorage.setItem(
          config.storageKey,
          JSON.stringify(crossBrowserData),
        );
        this.notifyListeners(config.storageKey, crossBrowserData.data);
      }
    } catch (error) {
      console.warn(`Error checking updates for ${config.storageKey}:`, error);
    }
  }

  /**
   * Notify subscribed listeners
   */
  private notifyListeners(dataType: string, data: any) {
    const listeners = this.listeners.get(dataType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.warn("Error in sync listener:", error);
        }
      });
    }
  }

  /**
   * Broadcast to other tabs/windows
   */
  private broadcast(channelName: string, data: SyncData) {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      channel.postMessage(data);
    }
  }

  /**
   * Store data in cookies for cross-browser access
   */
  private setCrossBrowserData(cookieKey: string, data: SyncData) {
    try {
      const encodedData = encodeURIComponent(JSON.stringify(data));
      document.cookie = `${cookieKey}=${encodedData}; max-age=31536000; path=/; SameSite=Lax`;
    } catch (error) {
      console.warn("Could not set cross-browser data:", error);
    }
  }

  /**
   * Retrieve data from cookies
   */
  private getCrossBrowserData(cookieKey: string): SyncData | null {
    try {
      const cookies = document.cookie.split(";");
      const targetCookie = cookies.find((cookie) =>
        cookie.trim().startsWith(`${cookieKey}=`),
      );

      if (targetCookie) {
        const cookieData = targetCookie.split("=")[1];
        const decodedData = decodeURIComponent(cookieData);
        return JSON.parse(decodedData);
      }

      return null;
    } catch (error) {
      console.warn("Could not parse cross-browser data:", error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Close all broadcast channels
    this.activeChannels.forEach((channel) => channel.close());
    this.activeChannels.clear();

    // Clear all intervals
    this.syncIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.syncIntervals.clear();

    // Clear listeners
    this.listeners.clear();
  }

  /**
   * Get sync status for debugging
   */
  getStatus() {
    return {
      activeChannels: Array.from(this.activeChannels.keys()),
      syncIntervals: Array.from(this.syncIntervals.keys()),
      listeners: Array.from(this.listeners.keys()),
    };
  }
}

// Export singleton instance
export const crossBrowserSync = new CrossBrowserSyncService();

// Sync configurations for different data types
export const SYNC_CONFIGS = {
  PRICING_CONFIG: {
    storageKey: "peptok_platform_global_config",
    cookieKey: "peptok_config",
    broadcastChannel: "peptok_config_sync",
    syncInterval: 5000,
  },
  USER_MANAGEMENT: {
    storageKey: "peptok_user_management",
    cookieKey: "peptok_users",
    broadcastChannel: "peptok_users_sync",
    syncInterval: 7000,
  },
  COMPANY_MANAGEMENT: {
    storageKey: "peptok_company_management",
    cookieKey: "peptok_companies",
    broadcastChannel: "peptok_companies_sync",
    syncInterval: 8000,
  },
  PLATFORM_SETTINGS: {
    storageKey: "peptok_platform_settings",
    cookieKey: "peptok_settings",
    broadcastChannel: "peptok_settings_sync",
    syncInterval: 6000,
  },
  SECURITY_SETTINGS: {
    storageKey: "peptok_security_settings",
    cookieKey: "peptok_security",
    broadcastChannel: "peptok_security_sync",
    syncInterval: 5000,
  },
  ANALYTICS_SETTINGS: {
    storageKey: "peptok_analytics_settings",
    cookieKey: "peptok_analytics",
    broadcastChannel: "peptok_analytics_sync",
    syncInterval: 6000,
  },
  AUDIT_LOG: {
    storageKey: "peptok_platform_audit_log",
    cookieKey: "peptok_audit",
    broadcastChannel: "peptok_audit_sync",
    syncInterval: 10000,
  },
  MATCHING_CONFIG: {
    storageKey: "peptok_matching_config",
    cookieKey: "peptok_matching",
    broadcastChannel: "peptok_matching_sync",
    syncInterval: 5000,
  },
} as const;

// Auto-cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    crossBrowserSync.cleanup();
  });
}
