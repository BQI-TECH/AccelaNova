const CACHE_NAME = 'akili-v3';
// Vite emits index.js and index.css at the root of the build by config.
// Keep image paths relative to public/.
const urlsToCache = [
    '/',
    '/index.js',
    '/index.css',
    '/akili.png',
    '/akili-white.png',
    '/favicon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response;
            return fetch(event.request).catch(() => {
                // If offline and the request was for root, fall back to cached '/'
                if (event.request.mode === 'navigate') return caches.match('/');
                return Response.error();
            });
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