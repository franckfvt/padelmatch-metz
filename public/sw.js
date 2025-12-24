/**
 * ============================================
 * SERVICE WORKER - JUNTO PWA
 * ============================================
 * 
 * Stratégie: Network First avec Fallback Cache
 * - Essaie d'abord le réseau
 * - Si offline, utilise le cache
 * - Cache les ressources statiques
 * 
 * ============================================
 */

const CACHE_NAME = 'junto-v1.0.0';

// Ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Pages à cacher dynamiquement
const CACHE_PAGES = [
  '/dashboard',
  '/dashboard/parties',
  '/dashboard/joueurs',
  '/dashboard/carte',
];

// Installation - Pré-cache des ressources essentielles
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pré-cache des ressources');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activer immédiatement le nouveau SW
        return self.skipWaiting();
      })
  );
});

// Activation - Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Prendre le contrôle de toutes les pages
        return self.clients.claim();
      })
  );
});

// Fetch - Stratégie Network First
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ignorer les requêtes API Supabase (toujours réseau)
  if (url.hostname.includes('supabase')) return;
  
  // Ignorer les requêtes d'analytics, etc.
  if (url.hostname.includes('google') || url.hostname.includes('analytics')) return;
  
  event.respondWith(
    // Stratégie: Network First
    fetch(request)
      .then((response) => {
        // Si succès, mettre en cache et retourner
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Cacher seulement les pages et assets statiques
            if (
              request.destination === 'document' ||
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'image' ||
              request.destination === 'font'
            ) {
              cache.put(request, responseClone);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // Si offline, chercher dans le cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si c'est une page, retourner la page offline
            if (request.destination === 'document') {
              return caches.match('/offline');
            }
            
            // Sinon, retourner une erreur
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push Notifications (pour plus tard)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nouvelle notification Junto',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Junto', options)
  );
});

// Click sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si une fenêtre est déjà ouverte, la focus
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background Sync (pour les actions offline)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-invitations') {
    event.waitUntil(syncInvitations());
  }
});

async function syncInvitations() {
  // Récupérer les invitations en attente depuis IndexedDB
  // et les envoyer au serveur
  console.log('[SW] Synchronisation des invitations...');
}