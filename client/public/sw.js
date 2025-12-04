/**
 * ============================================================================
 * SERVICE WORKER - PUSH NOTIFICATIONS & CACHE MANAGEMENT
 * ============================================================================
 * 
 * Gère les notifications push même quand l'application est fermée.
 * Supporte les actions (voir, archiver, marquer lu).
 * Gère le cache et force le rechargement après les mises à jour.
 * 
 * Date: Décembre 2025
 */

// Version du service worker - INCRÉMENTER À CHAQUE DÉPLOIEMENT
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `profitum-cache-${CACHE_VERSION}`;
const NOTIFICATION_CACHE = `profitum-notifications-${CACHE_VERSION}`;

// Installation
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installé - Version:', CACHE_VERSION);
  // Force l'activation immédiate du nouveau SW
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé - Version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== NOTIFICATION_CACHE)
            .map((name) => {
              console.log('🗑️ Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Prendre le contrôle de tous les clients immédiatement
      self.clients.claim()
    ]).then(() => {
      // Notifier tous les clients qu'une nouvelle version est disponible
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification reçue');
  
  if (!event.data) {
    console.warn('⚠️ Push sans données');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('❌ Erreur parsing push data:', error);
    return;
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/badge.png',
    image: data.image,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      url: data.url || '/',
      notification_id: data.notification_id,
      ...data.data
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/dismiss.png'
      }
    ],
    dir: data.dir || 'ltr',
    lang: data.lang || 'fr-FR',
    renotify: data.renotify || false,
    timestamp: data.timestamp || Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Profitum', options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Clic notification:', event.action);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notification_id;

  // Gérer les actions
  if (event.action === 'view') {
    // Ouvrir l'URL associée
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Si une fenêtre est déjà ouverte, l'utiliser
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Sinon, ouvrir une nouvelle fenêtre
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
        .then(() => {
          // Marquer la notification comme lue
          if (notificationId) {
            return fetch(`/api/notifications/${notificationId}/read`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Simplement fermer (notification déjà fermée)
    console.log('✅ Notification ignorée');
  } else {
    // Clic par défaut (pas sur un bouton d'action)
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          if (clientList.length > 0) {
            // Focuser la première fenêtre ouverte
            return clientList[0].focus();
          }
          // Ouvrir une nouvelle fenêtre
          return clients.openWindow('/notification-center');
        })
    );
  }
});

// Fermeture d'une notification
self.addEventListener('notificationclose', (event) => {
  console.log('✅ Notification fermée:', event.notification.tag);
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas cacher les requêtes API
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  // Pour les assets JS/CSS, toujours fetch en priorité (Network First)
  if (request.url.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si la requête réussit, mettre en cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // En cas d'échec, utiliser le cache
          return caches.match(request);
        })
    );
    return;
  }

  // Pour les images et assets statiques, utiliser le cache en priorité (Cache First)
  if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Pour le document HTML principal, toujours fetch (éviter le cache du HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }
});

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
  console.log('📨 Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }
});

console.log('🚀 Service Worker Profitum prêt - Version:', CACHE_VERSION);

