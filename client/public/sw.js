// Service Worker pour les notifications push
// Version: 1.0.0

const CACHE_NAME = 'financial-tracker-v1';
const NOTIFICATION_CACHE = 'notifications-v1';

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css'
      ]);
    })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('Notification push reçue:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification',
      icon: data.icon || '/images/logo.png',
      badge: data.badge || '/images/badge.png',
      image: data.image,
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      dir: 'ltr',
      lang: 'fr-FR',
      renotify: data.renotify || false,
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'FinancialTracker', options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  // Déterminer l'URL à ouvrir selon l'action
  let urlToOpen = '/';
  
  if (action === 'view') {
    urlToOpen = data.url || '/dashboard';
  } else if (action === 'dismiss') {
    // Marquer comme lue sans ouvrir
    if (data.notificationId) {
      fetch(`/api/notifications/${data.notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(console.error);
    }
    return;
  } else if (data.url) {
    urlToOpen = data.url;
  }
  
  // Ouvrir l'URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher un onglet ouvert
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(urlToOpen).then((client) => client.focus());
        }
      }
      
      // Ouvrir un nouvel onglet si aucun n'est ouvert
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event);
  
  const data = event.notification.data;
  
  // Marquer comme lue si configuré
  if (data.autoMarkAsRead && data.notificationId) {
    fetch(`/api/notifications/${data.notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(console.error);
  }
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  console.log('Message reçu dans SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// Fonction utilitaire pour envoyer des notifications de test
function sendTestNotification() {
  self.registration.showNotification('Test Notification', {
    body: 'Ceci est une notification de test',
    icon: '/images/logo.png',
    badge: '/images/badge.png',
    tag: 'test',
    data: {
      url: '/dashboard',
      notificationId: 'test-123'
    },
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/images/view.png'
      },
      {
        action: 'dismiss',
        title: 'Fermer',
        icon: '/images/dismiss.png'
      }
    ]
  });
} 