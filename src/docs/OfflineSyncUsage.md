# Offline Sync System Usage Guide

The offline sync system provides comprehensive offline capabilities with automatic backend synchronization for the entire application.

## Key Components

### 1. Offline Sync Service (`offlineSync.ts`)

Core service handling offline detection, operation queuing, and automatic synchronization.

### 2. Offline API Wrapper (`offlineApiWrapper.ts`)

High-level wrapper providing offline-enabled versions of API operations.

### 3. React Hook (`useOfflineSync.ts`)

React hook for integrating offline capabilities into components.

### 4. Offline Indicator (`OfflineIndicator.tsx`)

UI component showing sync status and pending operations.

### 5. Service Worker (`sw.js`)

Background sync and caching support.

## Usage Examples

### Basic Component Integration

```tsx
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { offlineApi } from "@/services/offlineApiWrapper";

function MyComponent() {
  const { isOnline, isSyncing, executeOffline } = useOfflineSync();

  const handleCreateItem = async () => {
    const result = await offlineApi.createMentorshipRequest(
      {
        title: "New Request",
        description: "Description here",
      },
      {
        priority: "high",
        maxRetries: 5,
      },
    );

    console.log("Created:", result);
  };

  return (
    <div>
      <p>Status: {isOnline ? "Online" : "Offline"}</p>
      <button onClick={handleCreateItem} disabled={isSyncing}>
        Create Item {!isOnline && "(will sync when online)"}
      </button>
    </div>
  );
}
```

### Using the Entity Hook

```tsx
import { useOfflineEntity } from "@/hooks/useOfflineSync";

function MentorshipRequests() {
  const {
    data: requests,
    loading,
    error,
    refresh,
    updateData,
  } = useOfflineEntity(
    "mentorship_requests",
    () => api.getMentorshipRequests(),
    [],
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {requests?.map((request) => <div key={request.id}>{request.title}</div>)}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Optimistic Updates

```tsx
import { useOfflineSync } from "@/hooks/useOfflineSync";

function EditableItem({ item }) {
  const { createOptimisticUpdate } = useOfflineSync();
  const [localItem, setLocalItem] = useState(item);

  const handleUpdate = async (updates) => {
    // Apply optimistic update immediately
    const optimisticItem = createOptimisticUpdate(localItem, updates, {
      type: "UPDATE",
      endpoint: `/api/items/${item.id}`,
      method: "PUT",
      data: updates,
      priority: "medium",
      maxRetries: 3,
      entityType: "item",
      entityId: item.id,
    });

    setLocalItem(optimisticItem);
  };

  return (
    <div>
      <h3>{localItem.title}</h3>
      <button onClick={() => handleUpdate({ title: "Updated" })}>
        Update Title
      </button>
    </div>
  );
}
```

### Manual Sync Control

```tsx
import { useOfflineSync } from "@/hooks/useOfflineSync";

function SyncControls() {
  const { status, triggerSync, clearQueue, pendingOperations } =
    useOfflineSync();

  return (
    <div>
      <p>Pending: {status.pendingOperations}</p>
      <p>Failed: {status.failedOperations}</p>

      <button onClick={triggerSync} disabled={status.isSyncing}>
        Sync Now
      </button>

      <button onClick={clearQueue}>Clear Queue</button>

      <div>
        {pendingOperations.map((op) => (
          <div key={op.id}>
            {op.type} {op.entityType} - Priority: {op.priority}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Custom Operation with Fallback

```tsx
import { useOfflineOperation } from "@/hooks/useOfflineSync";

function CustomOperation() {
  const { execute, loading, error } = useOfflineOperation();

  const handleCustomAction = async () => {
    const result = await execute(() => api.customOperation(), {
      fallback: { success: true, message: "Queued for sync" },
      syncOperation: {
        type: "CREATE",
        endpoint: "/api/custom",
        method: "POST",
        data: { action: "custom" },
        priority: "low",
        maxRetries: 3,
        entityType: "custom_action",
      },
      onSuccess: (result) => console.log("Success:", result),
      onError: (error) => console.error("Failed:", error),
    });

    return result;
  };

  return (
    <button onClick={handleCustomAction} disabled={loading}>
      {loading ? "Processing..." : "Custom Action"}
    </button>
  );
}
```

## Configuration

### Conflict Resolution

```tsx
import { offlineSync } from "@/services/offlineSync";

// Set custom conflict resolution
offlineSync.setConflictResolver("mentorship_requests", {
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
```

### Service Worker Setup

Add to your `public/index.html`:

```html
<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
</script>
```

## Features

### Automatic Capabilities

- ✅ **Offline Detection** - Automatically detects online/offline status
- ✅ **Operation Queuing** - Queues operations when offline
- ✅ **Background Sync** - Syncs when connectivity restored
- ✅ **Caching** - Caches data for offline access
- ✅ **Retry Logic** - Progressive retry with exponential backoff
- ✅ **Conflict Resolution** - Configurable conflict resolution strategies

### Manual Controls

- ✅ **Manual Sync** - Trigger sync manually
- ✅ **Queue Management** - View and manage pending operations
- ✅ **Status Monitoring** - Real-time sync status updates
- ✅ **Data Management** - Save/retrieve offline data

### UI Integration

- ✅ **Status Indicator** - Visual sync status in bottom-right
- ✅ **Operation Details** - View pending operations
- ✅ **Progress Tracking** - Sync progress indication
- ✅ **Error Handling** - Display sync errors and retries

## Best Practices

1. **Use high priority for critical operations** (user actions)
2. **Use medium priority for automated operations** (background updates)
3. **Use low priority for non-essential operations** (analytics, logs)
4. **Always provide fallback data** for better offline experience
5. **Implement optimistic updates** for immediate user feedback
6. **Handle conflict resolution** based on your data requirements
7. **Cache frequently accessed data** for offline availability

## Testing Offline Mode

1. **Chrome DevTools**: Application → Service Workers → Offline
2. **Network Throttling**: Slow 3G or Offline simulation
3. **Manual Testing**: Disconnect network physically
4. **Service Worker**: Test background sync functionality

The offline sync system provides a robust foundation for offline-first applications with automatic synchronization capabilities.
