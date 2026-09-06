const CACHE_NAME = 'reducciones-v37';
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// Install: cache essential assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // Only cache same-origin GET requests (http/https)
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Cache successful same-origin responses
                if (response && response.status === 200 && response.type === 'basic') {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(function() {
                // Fallback to cache
                return caches.match(event.request).then(function(cachedResponse) {
                    return cachedResponse || new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});
