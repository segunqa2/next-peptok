// Service Worker for Offline Support and Background Sync
// Handles caching, background sync, and offline capabilities

const CACHE_NAME = "peptok-v1";
const API_CACHE_NAME = "peptok-api-v1";

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add other static assets as needed
];

// API endpoints to cache
const API_ENDPOINTS = [
  "/api/mentorship-requests",
  "/api/coaches",
  "/api/sessions",
  "/api/team/invitations",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker installed");
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker activated");
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle network requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(performBackgroundSync());
  }
});

// Handle API requests with cache-first strategy for GET, network-first for mutations
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE_NAME);

  try {
    if (request.method === "GET") {
      // Cache-first strategy for GET requests
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        // Return cached response and update cache in background
        updateCacheInBackground(request, cache);
        return cachedResponse;
      }
    }

    // Network-first strategy
    const networkResponse = await fetch(request);

    if (networkResponse.ok && request.method === "GET") {
      // Cache successful GET responses
      cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Network request failed:", error);

    if (request.method === "GET") {
      // Return cached response for failed GET requests
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Return offline fallback response
    return new Response(
      JSON.stringify({
        error: "Network unavailable",
        offline: true,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Static request failed:", error);

    // Return cached response or fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await cache.match("/");
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response("Offline", { status: 503 });
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request.clone(), networkResponse.clone());
    }
  } catch (error) {
    console.log("Background cache update failed:", error);
  }
}

// Perform background sync
async function performBackgroundSync() {
  console.log("Performing background sync...");

  try {
    // Get sync queue from IndexedDB or localStorage
    const syncQueue = await getSyncQueue();

    if (syncQueue.length === 0) {
      console.log("No pending sync operations");
      return;
    }

    console.log(`Processing ${syncQueue.length} sync operations`);

    // Process each operation
    const results = await Promise.allSettled(
      syncQueue.map((operation) => processSyncOperation(operation)),
    );

    // Update sync queue with results
    const successfulOperations = results
      .map((result, index) => ({ result, operation: syncQueue[index] }))
      .filter(({ result }) => result.status === "fulfilled")
      .map(({ operation }) => operation);

    if (successfulOperations.length > 0) {
      await removeSyncOperations(successfulOperations);
      console.log(
        `Successfully synced ${successfulOperations.length} operations`,
      );
    }

    // Notify main thread of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETED",
        data: {
          processed: syncQueue.length,
          successful: successfulOperations.length,
          failed: syncQueue.length - successfulOperations.length,
        },
      });
    });
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Get sync queue from storage
async function getSyncQueue() {
  try {
    // Try to get from clients first
    const clients = await self.clients.matchAll();

    for (const client of clients) {
      try {
        const response = await new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => resolve(event.data);
          client.postMessage({ type: "GET_SYNC_QUEUE" }, [channel.port2]);
        });

        if (response && response.queue) {
          return response.queue;
        }
      } catch (error) {
        console.log("Failed to get sync queue from client:", error);
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to get sync queue:", error);
    return [];
  }
}

// Process individual sync operation
async function processSyncOperation(operation) {
  const { endpoint, method, data } = operation;

  const requestOptions = {
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

// Remove successfully synced operations
async function removeSyncOperations(operations) {
  const clients = await self.clients.matchAll();

  clients.forEach((client) => {
    client.postMessage({
      type: "REMOVE_SYNC_OPERATIONS",
      data: { operationIds: operations.map((op) => op.id) },
    });
  });
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "SYNC_NOW":
      event.waitUntil(performBackgroundSync());
      break;

    default:
      console.log("Unknown message type:", type);
  }
});

console.log("Service Worker loaded");
