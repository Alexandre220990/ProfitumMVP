/**
 * FIREBASE MESSAGING SERVICE WORKER
 * 
 * Ce service worker permet de recevoir des notifications push même quand
 * l'application est fermée ou en arrière-plan.
 * 
 * IMPORTANT :
 * - Ce fichier DOIT être dans /public pour être accessible
 * - Il sera servi à la racine du site : /firebase-messaging-sw.js
 * - Ne pas utiliser import/export ES6 (pas supporté dans SW)
 */

// Importer les scripts Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase (doit correspondre à client/src/config/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey-ReplaceWithRealKey",
  authDomain: "profitum-app.firebaseapp.com",
  projectId: "profitum-app",
  storageBucket: "profitum-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};

// Initialiser Firebase dans le Service Worker
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance Messaging
const messaging = firebase.messaging();

console.log('🔥 Firebase Messaging Service Worker chargé');

// ============================================================================
// GESTION DES NOTIFICATIONS BACKGROUND
// ============================================================================

/**
 * Événement déclenché quand une notification est reçue en arrière-plan
 */
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Notification reçue en arrière-plan:', payload);

  // Extraire les données de la notification
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Profitum';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'Nouvelle notification',
    icon: payload.notification?.icon || payload.data?.icon || '/Logo-Profitum.png',
    badge: '/favicon.ico',
    tag: payload.data?.notification_id || 'profitum-notification',
    data: {
      notification_id: payload.data?.notification_id,
      action_url: payload.data?.action_url || '/',
      click_action: payload.notification?.click_action || payload.data?.click_action,
      ...payload.data
    },
    requireInteraction: payload.data?.priority === 'urgent' || payload.data?.priority === 'critical',
    silent: false,
    vibrate: [200, 100, 200],
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/close.png'
      }
    ]
  };

  // Afficher la notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================================================
// GESTION DES CLICS SUR LES NOTIFICATIONS
// ============================================================================

/**
 * Événement déclenché quand l'utilisateur clique sur une notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('👆 [SW] Clic sur notification:', event);

  event.notification.close();

  // Récupérer l'URL d'action depuis les données
  const actionUrl = event.notification.data?.action_url || '/';
  const clickAction = event.notification.data?.click_action;

  // Gérer les actions
  if (event.action === 'dismiss') {
    // Ne rien faire, juste fermer
    return;
  }

  // Ouvrir ou focus l'application
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focuser
      for (const client of clientList) {
        if (client.url.includes(window.location.host) && 'focus' in client) {
          client.focus();
          
          // Naviguer vers l'URL d'action
          if (clickAction || actionUrl) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: clickAction || actionUrl,
              notification_id: event.notification.data?.notification_id
            });
          }
          
          return;
        }
      }

      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        const targetUrl = clickAction || actionUrl || '/';
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ============================================================================
// GESTION DES CLICS SUR LES ACTIONS
// ============================================================================

/**
 * Gérer les actions personnalisées (boutons dans la notification)
 */
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'view') {
    // Action "Voir" - ouvrir l'URL
    const url = event.notification.data?.action_url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'dismiss') {
    // Action "Ignorer" - marquer comme lue via API
    const notificationId = event.notification.data?.notification_id;
    if (notificationId) {
      event.waitUntil(
        fetch(`/api/notifications/${notificationId}/dismiss`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    }
  }
});

// ============================================================================
// GESTION DE L'INSTALLATION DU SERVICE WORKER
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Service Worker Firebase installé');
  self.skipWaiting(); // Activer immédiatement le nouveau SW
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Service Worker Firebase activé');
  event.waitUntil(clients.claim()); // Prendre contrôle de tous les clients
});

// ============================================================================
// DEBUGGING
// ============================================================================

// Log pour vérifier que le SW fonctionne
console.log('🚀 Firebase Messaging Service Worker opérationnel');
console.log('📦 Firebase version:', firebase.SDK_VERSION);
console.log('🔔 Messaging instance:', messaging ? 'Créée' : 'En attente');

