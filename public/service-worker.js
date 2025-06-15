/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

const CACHE_NAME = 'football-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Cache teams data after 12 PM
  if (event.request.url.includes('/api/v1/teams/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Check if teams are published (after 12 PM)
            if (response.ok) {
              const clonedResponse = response.clone();
              clonedResponse.json().then((data) => {
                if (data.isPublished) {
                  // Cache the response if teams are published
                  cache.put(event.request, response.clone());
                }
              });
            }
            return response;
          })
          .catch(() => {
            // If offline, try to serve from cache
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 