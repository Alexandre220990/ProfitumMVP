/**
 * ============================================================================
 * FIREBASE MESSAGING SERVICE WORKER
 * ============================================================================
 * 
 * Ce fichier est utilisé par Firebase Cloud Messaging pour gérer les
 * notifications push en background (quand l'app est fermée).
 * 
 * IMPORTANT : Ce fichier doit être dans /public/ et sera automatiquement
 * utilisé par Firebase Messaging si importScripts() est appelé depuis sw.js
 * OU si ce fichier est enregistré séparément comme Service Worker.
 * 
 * Pour utiliser ce fichier :
 * 1. Soit l'importer dans sw.js avec importScripts('firebase-messaging-sw.js')
 * 2. Soit l'enregistrer comme Service Worker séparé (non recommandé)
 */

// Configuration Firebase (doit être injectée au build time)
// Les valeurs par défaut seront remplacées par les variables d'environnement
const firebaseConfig = {
  apiKey: "%%VITE_FIREBASE_API_KEY%%",
  authDomain: "%%VITE_FIREBASE_AUTH_DOMAIN%%",
  projectId: "%%VITE_FIREBASE_PROJECT_ID%%",
  storageBucket: "%%VITE_FIREBASE_STORAGE_BUCKET%%",
  messagingSenderId: "%%VITE_FIREBASE_MESSAGING_SENDER_ID%%",
  appId: "%%VITE_FIREBASE_APP_ID%%",
  measurementId: "%%VITE_FIREBASE_MEASUREMENT_ID%%"
};

const vapidKey = "%%VITE_FIREBASE_VAPID_KEY%%";

// Vérifier si Firebase est disponible (chargé depuis CDN ou bundle)
try {
  // Importer Firebase depuis le CDN si disponible
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

  // Initialiser Firebase
  firebase.initializeApp(firebaseConfig);

  // Récupérer l'instance de messaging
  const messaging = firebase.messaging();

  // Écouter les messages en background
  messaging.onBackgroundMessage((payload) => {
    console.log('🔔 Message FCM reçu en background:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Profitum';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || payload.data?.message || '',
      icon: payload.notification?.icon || payload.data?.icon || '/images/icon-192x192.png',
      badge: payload.notification?.badge || payload.data?.badge || '/images/icon-96x96.png',
      image: payload.notification?.image || payload.data?.image,
      tag: payload.data?.tag || payload.data?.notification_id || 'default',
      requireInteraction: payload.data?.requireInteraction || false,
      silent: payload.data?.silent || false,
      vibrate: payload.data?.vibrate || [200, 100, 200],
      data: {
        url: payload.data?.url || payload.fcmOptions?.link || '/',
        notification_id: payload.data?.notification_id,
        ...payload.data
      },
      actions: payload.data?.actions || [
        {
          action: 'view',
          title: 'Voir',
          icon: '/images/icon-96x96.png'
        },
        {
          action: 'archive',
          title: 'Archiver',
          icon: '/images/icon-96x96.png'
        }
      ],
      dir: payload.notification?.dir || 'ltr',
      lang: payload.notification?.lang || 'fr-FR',
      renotify: payload.data?.renotify || false,
      timestamp: payload.data?.timestamp || Date.now()
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  console.log('✅ Firebase Messaging Service Worker initialisé');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase Messaging:', error);
  console.warn('⚠️ Les notifications Firebase ne fonctionneront pas. Vérifiez la configuration.');
}
