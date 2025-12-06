/**
 * useEventReports
 * Hook optimisé pour charger les rapports d'événements avec batch et cache
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { config } from '@/config/env';

interface EventReport {
  id: string;
  event_id: string;
  content?: string;
  summary?: string;
  created_at?: string;
  [key: string]: any;
}

interface UseEventReportsReturn {
  reports: Record<string, EventReport | null>;
  loading: Set<string>;
  loadReport: (eventId: string) => Promise<void>;
  loadReportsBatch: (eventIds: string[]) => Promise<void>;
  clearCache: () => void;
}

// Cache global pour partager les rapports entre composants
const globalReportsCache = new Map<string, EventReport | null>();
const loadingPromises = new Map<string, Promise<void>>();

export function useEventReports(
  eventIds: string[] = [],
  autoLoad: boolean = true
): UseEventReportsReturn {
  const [reports, setReports] = useState<Record<string, EventReport | null>>({});
  const loadingRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  // Initialiser depuis le cache global
  useEffect(() => {
    const cached: Record<string, EventReport | null> = {};
    eventIds.forEach((eventId) => {
      if (globalReportsCache.has(eventId)) {
        cached[eventId] = globalReportsCache.get(eventId)!;
      }
    });
    if (Object.keys(cached).length > 0) {
      setReports((prev) => ({ ...prev, ...cached }));
    }
  }, []);

  // Charger un rapport individuel
  const loadReport = useCallback(async (eventId: string) => {
    // Vérifier le cache global
    if (globalReportsCache.has(eventId)) {
      const cached = globalReportsCache.get(eventId)!;
      setReports((prev) => ({ ...prev, [eventId]: cached }));
      return;
    }

    // Éviter les chargements en double
    if (loadingRef.current.has(eventId) || loadingPromises.has(eventId)) {
      return;
    }

    loadingRef.current.add(eventId);
    setLoading((prev) => new Set([...prev, eventId]));

    const loadPromise = (async () => {
      try {
        const token = await getSupabaseToken();
        const response = await fetch(`${config.API_URL}/api/rdv/${eventId}/report`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        let reportData: EventReport | null = null;

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            reportData = data.data;
          }
        }

        // Mettre à jour le cache global
        globalReportsCache.set(eventId, reportData);

        // Mettre à jour l'état local
        setReports((prev) => {
          // Éviter les mises à jour inutiles
          if (prev[eventId] === reportData) return prev;
          return {
            ...prev,
            [eventId]: reportData
          };
        });
      } catch (error) {
        console.error(`❌ Erreur chargement rapport ${eventId}:`, error);
        globalReportsCache.set(eventId, null);
        setReports((prev) => ({
          ...prev,
          [eventId]: null
        }));
      } finally {
        loadingRef.current.delete(eventId);
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        loadingPromises.delete(eventId);
      }
    })();

    loadingPromises.set(eventId, loadPromise);
    await loadPromise;
  }, []);

  // Charger plusieurs rapports en batch
  const loadReportsBatch = useCallback(
    async (eventIds: string[]) => {
      // Filtrer les IDs déjà en cache ou en cours de chargement
      const idsToLoad = eventIds.filter(
        (id) => !globalReportsCache.has(id) && !loadingRef.current.has(id)
      );

      if (idsToLoad.length === 0) {
        // Charger depuis le cache
        const cached: Record<string, EventReport | null> = {};
        eventIds.forEach((eventId) => {
          if (globalReportsCache.has(eventId)) {
            cached[eventId] = globalReportsCache.get(eventId)!;
          }
        });
        if (Object.keys(cached).length > 0) {
          setReports((prev) => ({ ...prev, ...cached }));
        }
        return;
      }

      // Marquer comme en cours de chargement
      idsToLoad.forEach((id) => {
        loadingRef.current.add(id);
      });
      setLoading((prev) => new Set([...prev, ...idsToLoad]));

      try {
        // Charger en parallèle (batch)
        const promises = idsToLoad.map((eventId) => loadReport(eventId));
        await Promise.allSettled(promises);
      } catch (error) {
        console.error('❌ Erreur chargement batch rapports:', error);
      } finally {
        idsToLoad.forEach((id) => {
          loadingRef.current.delete(id);
        });
        setLoading((prev) => {
          const next = new Set(prev);
          idsToLoad.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [loadReport]
  );

  // Chargement automatique
  useEffect(() => {
    if (autoLoad && eventIds.length > 0) {
      loadReportsBatch(eventIds);
    }
  }, [autoLoad, eventIds.join(','), loadReportsBatch]);

  // Nettoyer le cache
  const clearCache = useCallback(() => {
    globalReportsCache.clear();
    setReports({});
  }, []);

  return {
    reports,
    loading,
    loadReport,
    loadReportsBatch,
    clearCache
  };
}
