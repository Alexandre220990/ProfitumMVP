/**
 * CONFIGURATION FIREBASE CLOUD MESSAGING (FCM)
 * 
 * Ce fichier configure Firebase pour les notifications push background.
 * Les notifications fonctionneront même quand l'application est fermée.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// ============================================================================
// CONFIGURATION FIREBASE
// ============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKey-ReplaceWithRealKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "profitum-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "profitum-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "profitum-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Clé VAPID publique (à générer depuis Firebase Console)
export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 
  "BDemo-VAPID-Key-Replace-With-Real-Key-From-Firebase-Console";

// ============================================================================
// INITIALISATION FIREBASE
// ============================================================================

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialiser Firebase (si pas déjà fait)
 */
export function initializeFirebase(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Vérifier si Firebase est déjà initialisé
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  console.log('🔥 Firebase initialisé avec succès');
  return firebaseApp;
}

/**
 * Obtenir l'instance Firebase Messaging
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  try {
    // Vérifier si les notifications sont supportées
    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ Firebase Messaging non supporté sur cet appareil');
      return null;
    }

    if (messaging) {
      return messaging;
    }

    const app = initializeFirebase();
    messaging = getMessaging(app);
    
    console.log('📱 Firebase Messaging initialisé');
    return messaging;
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Messaging:', error);
    return null;
  }
}

/**
 * Obtenir le token FCM pour cet appareil
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) {
      return null;
    }

    // Vérifier les permissions
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('⚠️ Permission notifications refusée');
      return null;
    }

    // Obtenir le token
    const token = await getToken(messagingInstance, {
      vapidKey: FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log('✅ FCM Token obtenu:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ Impossible d\'obtenir le FCM token');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur obtention FCM token:', error);
    return null;
  }
}

/**
 * Écouter les messages en foreground (quand l'app est ouverte)
 */
export async function onForegroundMessage(
  callback: (payload: unknown) => void
): Promise<(() => void) | null> {
  try {
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) {
      return null;
    }

    const unsubscribe = onMessage(messagingInstance, (payload) => {
      console.log('📬 Message FCM reçu (foreground):', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Erreur écoute messages foreground:', error);
    return null;
  }
}

/**
 * Vérifier si Firebase Messaging est supporté
 */
export async function isFCMSupported(): Promise<boolean> {
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

// Les exports sont déjà déclarés avec les fonctions ci-dessus

