import { useState, useEffect, useCallback } from 'react';
import { config } from '@/config/env';
import { toast } from 'sonner';
import { NOTIFICATION_SLA_CONFIG } from '@/utils/notification-sla';

export interface NotificationTypePreference {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
  };
  slaChannels: {
    target: { push: boolean; email: boolean };      // 24h
    acceptable: { push: boolean; email: boolean }; // 48h
    critical: { push: boolean; email: boolean };   // 120h
  };
}

export interface NotificationPreferences {
  [notificationType: string]: NotificationTypePreference;
}

export interface SLAPreferences {
  [notificationType: string]: {
    targetHours: number;
    acceptableHours: number;
    criticalHours: number;
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [slaPreferences, setSlaPreferences] = useState<SLAPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialiser les préférences par défaut
  const initializeDefaults = useCallback(() => {
    const defaults: NotificationPreferences = {};
    const slaDefaults: SLAPreferences = {};

    // Parcourir tous les types de notifications avec SLA
    Object.keys(NOTIFICATION_SLA_CONFIG).forEach((type) => {
      if (type === 'default') return;
      
      defaults[type] = {
        enabled: true,
        channels: {
          push: true,
          email: true,
        },
        slaChannels: {
          target: { push: true, email: true },
          acceptable: { push: true, email: true },
          critical: { push: true, email: true },
        },
      };

      const sla = NOTIFICATION_SLA_CONFIG[type];
      slaDefaults[type] = {
        targetHours: sla.targetHours,
        acceptableHours: sla.acceptableHours,
        criticalHours: sla.criticalHours,
      };
    });

    return { defaults, slaDefaults };
  }, []);

  // Charger les préférences depuis le serveur
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Vérifier si admin
      const userResponse = await fetch(`${config.API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setIsAdmin(userData.data?.type === 'admin');
      }

      // Charger les préférences
      const response = await fetch(`${config.API_URL}/api/notifications/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const result = await response.json();
      const { defaults, slaDefaults } = initializeDefaults();

      if (result.data?.preferences) {
        const prefs = result.data.preferences;
        
        // Fusionner avec les défauts
        const merged: NotificationPreferences = { ...defaults };
        if (prefs.notification_types) {
          Object.keys(prefs.notification_types).forEach((type) => {
            if (merged[type]) {
              merged[type] = {
                ...merged[type],
                ...prefs.notification_types[type],
              };
            }
          });
        }
        setPreferences(merged);

        // Charger les SLA si admin
        if (isAdmin && prefs.sla_config) {
          setSlaPreferences({ ...slaDefaults, ...prefs.sla_config });
        } else {
          setSlaPreferences(slaDefaults);
        }
      } else {
        setPreferences(defaults);
        setSlaPreferences(slaDefaults);
      }
    } catch (error: any) {
      console.error('Erreur chargement préférences:', error);
      const { defaults, slaDefaults } = initializeDefaults();
      setPreferences(defaults);
      setSlaPreferences(slaDefaults);
      toast.error('Erreur', {
        description: 'Impossible de charger les préférences',
      });
    } finally {
      setLoading(false);
    }
  }, [initializeDefaults, isAdmin]);

  // Sauvegarder les préférences
  const savePreferences = useCallback(async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const payload: any = {
        notification_types: preferences,
      };

      // Ajouter les SLA si admin
      if (isAdmin) {
        payload.sla_config = slaPreferences;
      }

      const response = await fetch(`${config.API_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      toast.success('Préférences sauvegardées', {
        description: 'Vos paramètres de notifications ont été mis à jour',
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde préférences:', error);
      toast.error('Erreur', {
        description: 'Impossible de sauvegarder les préférences',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [preferences, slaPreferences, isAdmin]);

  // Mettre à jour une préférence de type
  const updateTypePreference = useCallback((
    type: string,
    updates: Partial<NotificationTypePreference>
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...updates,
      },
    }));
  }, []);

  // Toggle l'activation d'un type de notification
  const toggleType = useCallback((type: string, enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled,
      },
    }));
  }, []);

  // Mettre à jour un canal pour un type
  const updateChannel = useCallback((
    type: string,
    channel: 'push' | 'email',
    enabled: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        channels: {
          ...prev[type].channels,
          [channel]: enabled,
        },
      },
    }));
  }, []);

  // Mettre à jour un canal SLA
  const updateSLAChannel = useCallback((
    type: string,
    slaLevel: 'target' | 'acceptable' | 'critical',
    channel: 'push' | 'email',
    enabled: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        slaChannels: {
          ...prev[type].slaChannels,
          [slaLevel]: {
            ...prev[type].slaChannels[slaLevel],
            [channel]: enabled,
          },
        },
      },
    }));
  }, []);

  // Mettre à jour les durées SLA (admin uniquement)
  const updateSLADurations = useCallback((
    type: string,
    durations: { targetHours?: number; acceptableHours?: number; criticalHours?: number }
  ) => {
    if (!isAdmin) return;
    
    setSlaPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...durations,
      },
    }));
  }, [isAdmin]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    slaPreferences,
    loading,
    saving,
    isAdmin,
    savePreferences,
    updateTypePreference,
    toggleType,
    updateChannel,
    updateSLAChannel,
    updateSLADurations,
    reload: loadPreferences,
  };
}

