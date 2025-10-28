/**
 * ============================================================================
 * SERVICE WORKER - PUSH NOTIFICATIONS
 * ============================================================================
 * 
 * Gère les notifications push même quand l'application est fermée.
 * Supporte les actions (voir, archiver, marquer lu).
 * 
 * Date: 27 Octobre 2025
 */

// Version du service worker
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `profitum-notifications-${CACHE_VERSION}`;

// Installation
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installé');
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
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

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
  console.log('📨 Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker Profitum Notifications prêt');

