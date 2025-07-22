import { useState, useEffect, useCallback } from 'react';

export interface UsePushNotificationsReturn {
  // État
  isSupported: boolean;
  isInitialized: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  
  // Préférences
  preferences: null;
  updatePreferences: () => Promise<void>;
  
  // Utilitaires
  isQuietHours: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  // Hook désactivé (service manquant)
  return {
    isSupported: false,
    isInitialized: false,
    permission: 'default',
    isEnabled: false,
    isLoading: false,
    error: null,
    initialize: async () => false,
    requestPermission: async () => 'default',
    subscribe: async () => false,
    unsubscribe: async () => false,
    sendTestNotification: async () => {},
    preferences: null,
    updatePreferences: async () => {},
    isQuietHours: false,
  };
} 