// Blood Pressure App Service Worker
// Version 1.0 - Offline functionality for elderly users

const CACHE_NAME = 'bloodpressure-app-v1';
const API_CACHE_NAME = 'bloodpressure-api-v1';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/profile',
  '/api/records',
  '/api/medications'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: try network first, then cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle API requests with cache-first strategy for GET requests
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  try {
    // For GET requests, try network first, cache as fallback
    if (request.method === 'GET') {
      try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          // Cache the successful response
          const cache = await caches.open(API_CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }

        throw new Error('Network response not ok');
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          console.log('Service Worker: Serving API from cache', url.pathname);
          return cachedResponse;
        }

        // If cache also fails, return offline message
        return new Response(
          JSON.stringify({
            error: 'Offline',
            message: '当前离线状态，请检查网络连接'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // For POST/PUT/DELETE, always try network (no caching)
    return await fetch(request);

  } catch (error) {
    console.error('Service Worker: API request failed', error);
    return new Response(
      JSON.stringify({
        error: 'Request failed',
        message: '请求失败，请稍后重试'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, try network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('Service Worker: Static request failed', error);

    // For HTML documents, return a basic offline page
    if (request.destination === 'document') {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>血压记录APP - 离线状态</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                font-size: 18px;
                color: #333;
              }
              .offline-icon { font-size: 64px; margin-bottom: 20px; }
              .offline-message { margin-bottom: 20px; }
              .retry-button {
                padding: 15px 30px;
                font-size: 16px;
                background: #1890ff;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="offline-icon">📡</div>
            <h1>当前处于离线状态</h1>
            <div class="offline-message">
              <p>请检查您的网络连接，然后重试</p>
              <p>部分功能在离线状态下仍然可用</p>
            </div>
            <button class="retry-button" onclick="window.location.reload()">重新加载</button>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Offline', { status: 503 });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingRequests());
  }
});

// Sync any pending requests when back online
async function syncPendingRequests() {
  // This would sync any pending blood pressure records or medication data
  // stored locally while offline
  console.log('Service Worker: Syncing pending requests...');

  // Implementation would depend on local storage strategy
  // for now, we'll just clear any stale caches
  try {
    const apiCache = await caches.open(API_CACHE_NAME);
    // Optionally refresh cached API data
    console.log('Service Worker: Sync complete');
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Push notification support (for medication reminders)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: event.data ? event.data.text() : '请记得测量血压和服药',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: 'medication-reminder',
    actions: [
      {
        action: 'view',
        title: '查看详情',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: '稍后提醒',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('血压记录提醒', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
  // 'dismiss' action just closes the notification
});