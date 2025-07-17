// Service de notifications push avancé
// Gère les permissions, tokens et envoi de notifications

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: any;
  actions?: NotificationAction[];
  renotify?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Interface pour notre service (différente de l'API native)
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  categories: {
    [key: string]: boolean;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initialiser le service de notifications push
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications push non supportées');
      return false;
    }

    try {
      // Enregistrer le service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', this.registration);

      // Vérifier si déjà abonné
      this.subscription = await this.registration.pushManager.getSubscription();
      
      // Écouter les mises à jour du service worker
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Erreur initialisation notifications push:', error);
      return false;
    }
  }

  /**
   * Demander la permission pour les notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications push non supportées');
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.subscribeToPush();
      }
      
      return permission;
    } catch (error) {
      console.error('Erreur demande permission:', error);
      throw error;
    }
  }

  /**
   * S'abonner aux notifications push
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker non enregistré');
    }

    try {
      // Générer les clés VAPID
      const vapidPublicKey = this.urlBase64ToUint8Array(''); // Clé VAPID à configurer
      
      // S'abonner
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Envoyer la subscription au serveur
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('Abonnement push créé:', this.subscription);
      return this.subscription;
    } catch (error) {
      console.error('Erreur abonnement push:', error);
      throw error;
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer();
      
      this.subscription = null;
      console.log('Désabonnement push réussi');
      return true;
    } catch (error) {
      console.error('Erreur désabonnement push:', error);
      return false;
    }
  }

  /**
   * Envoyer une notification locale (pour les tests)
   */
  async sendLocalNotification(data: PushNotificationData): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker non enregistré');
    }

    try {
      const options: any = {
        body: data.body,
        icon: data.icon || '/images/logo.png',
        badge: data.badge || '/images/badge.png',
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        data: data.data || {},
        dir: 'ltr',
        lang: 'fr-FR',
        renotify: data.renotify || false,
        timestamp: Date.now()
      };

      // Ajouter les propriétés optionnelles si supportées
      if (data.image) {
        options.image = data.image;
      }
      if (data.actions && data.actions.length > 0) {
        options.actions = data.actions;
      }

      await this.registration.showNotification(data.title, options);
    } catch (error) {
      console.error('Erreur envoi notification locale:', error);
      throw error;
    }
  }

  /**
   * Vérifier si les notifications sont activées
   */
  isNotificationEnabled(): boolean {
    return Notification.permission === 'granted' && !!this.subscription;
  }

  /**
   * Obtenir le statut des permissions
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Obtenir la subscription actuelle
   */
  getCurrentSubscription(): PushSubscription | null {
    return this.subscription;
  }

  /**
   * Vérifier si les heures silencieuses sont actives
   */
  isQuietHours(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // TODO: Récupérer les préférences utilisateur
    const quietHours = { start: '22:00', end: '08:00' };
    
    const startMinutes = this.timeToMinutes(quietHours.start);
    const endMinutes = this.timeToMinutes(quietHours.end);
    
    if (startMinutes > endMinutes) {
      // Période sur deux jours (ex: 22h-08h)
      return currentTime >= startMinutes || currentTime <= endMinutes;
    } else {
      // Période sur un jour
      return currentTime >= startMinutes && currentTime <= endMinutes;
    }
  }

  /**
   * Envoyer la subscription au serveur
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur envoi subscription au serveur');
      }
    } catch (error) {
      console.error('Erreur envoi subscription:', error);
      throw error;
    }
  }

  /**
   * Supprimer la subscription du serveur
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur suppression subscription du serveur');
      }
    } catch (error) {
      console.error('Erreur suppression subscription:', error);
      throw error;
    }
  }

  /**
   * Afficher une notification de mise à jour
   */
  private showUpdateNotification(): void {
    if (Notification.permission === 'granted') {
      const options: any = {
        body: 'Une nouvelle version de FinancialTracker est disponible. Cliquez pour actualiser.',
        icon: '/images/logo.png',
        tag: 'update',
        requireInteraction: true,
        actions: [
          {
            action: 'update',
            title: 'Actualiser'
          },
          {
            action: 'dismiss',
            title: 'Plus tard'
          }
        ]
      };

      new Notification('Mise à jour disponible', options);
    }
  }

  /**
   * Convertir une clé VAPID en Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convertir un ArrayBuffer en base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Convertir une heure en minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Instance singleton
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService; 