// Service Worker for Quranic Recitation Analysis PWA
const CACHE_NAME = 'quranic-recitation-v1';
const STATIC_CACHE_NAME = 'static-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-v1';
const AUDIO_CACHE_NAME = 'audio-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html',
  '/wasm/dtw.js',
  '/wasm/dtw.wasm',
  '/wasm/hmm.js',
  '/wasm/hmm.wasm',
  '/wasm/audio_processor.js',
  '/wasm/audio_processor.wasm',
  '/worklets/feature-extractor.js',
];

// Network-first resources
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/templates\//,
];

// Cache-first resources
const CACHE_FIRST_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.wasm$/,
  /\/wasm\//,
  /\/worklets\//,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== AUDIO_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different resource types
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
  } else if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (isAudioResource(request.url)) {
    event.respondWith(audioCache(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return caches.match('/offline.html');
  }
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy (for general resources)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cached || fetchPromise;
}

// Audio cache strategy (for audio files)
async function audioCache(request) {
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      // Only cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Audio cache failed:', error);
    // Return a default audio file or error response
    throw error;
  }
}

// Helper functions
function isStaticAsset(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isAudioResource(url) {
  return /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(url) || url.includes('/audio/');
}

// Background sync for offline recordings
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  try {
    // Get recordings from IndexedDB
    const recordings = await getOfflineRecordings();
    
    for (const recording of recordings) {
      try {
        await uploadRecording(recording);
        await removeOfflineRecording(recording.id);
      } catch (error) {
        console.error('Failed to sync recording:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getOfflineRecordings() {
  // Implementation would use IndexedDB
  return [];
}

async function uploadRecording(recording) {
  // Implementation would upload to server
  return fetch('/api/recordings', {
    method: 'POST',
    body: JSON.stringify(recording),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function removeOfflineRecording(id) {
  // Implementation would remove from IndexedDB
  return Promise.resolve();
}

// Push notifications for analysis results
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'analysis-complete',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Results',
        icon: '/icon-view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/results')
    );
  }
});

// Handle periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-templates') {
    event.waitUntil(updateTemplates());
  }
});

async function updateTemplates() {
  try {
    const response = await fetch('/api/templates/updates');
    const updates = await response.json();
    
    if (updates.length > 0) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      for (const update of updates) {
        const templateResponse = await fetch(`/api/templates/${update.id}`);
        if (templateResponse.ok) {
          cache.put(`/api/templates/${update.id}`, templateResponse);
        }
      }
    }
  } catch (error) {
    console.error('Failed to update templates:', error);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Service Worker loaded successfully');