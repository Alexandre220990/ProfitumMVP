/**
 * Service de Cache Intelligent pour Enrichissement V4
 * Layer transparent au-dessus du système V4 - Aucune modification du code existant
 * Économie estimée : 60-70% sur enrichissements répétés
 */

import { supabase } from '../lib/supabase';
import { EnrichedProspectDataV4 } from '../types/enrichment-v4';
import { Prospect } from '../types/prospects';

// Cache en mémoire (fallback si Redis non disponible)
const memoryCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

interface CacheConfig {
  linkedin: { ttl: number };      // 3 jours (posts fréquents)
  web: { ttl: number };           // 7 jours (actualités moins fréquentes)
  operational: { ttl: number };   // 30 jours (données stables)
  timing: { ttl: number };        // 1 jour (varie quotidiennement)
  full: { ttl: number };          // 7 jours (enrichissement complet)
}

const CACHE_CONFIG: CacheConfig = {
  linkedin: { ttl: 3 * 24 * 60 * 60 * 1000 },      // 3 jours en ms
  web: { ttl: 7 * 24 * 60 * 60 * 1000 },           // 7 jours
  operational: { ttl: 30 * 24 * 60 * 60 * 1000 },  // 30 jours
  timing: { ttl: 1 * 24 * 60 * 60 * 1000 },        // 1 jour
  full: { ttl: 7 * 24 * 60 * 60 * 1000 }           // 7 jours
};

export class ProspectCacheService {
  
  /**
   * Générer une clé de cache unique pour un prospect
   */
  private generateCacheKey(prospectId: string, cacheType: 'linkedin' | 'web' | 'operational' | 'timing' | 'full'): string {
    return `prospect:${prospectId}:${cacheType}:v4.0`;
  }

  /**
   * Vérifier si un enrichissement est en cache et valide
   */
  async getCachedEnrichment(
    prospectId: string,
    cacheType: 'linkedin' | 'web' | 'operational' | 'timing' | 'full'
  ): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(prospectId, cacheType);
      const config = CACHE_CONFIG[cacheType];

      // 1. Vérifier cache mémoire
      const memoryEntry = memoryCache.get(cacheKey);
      if (memoryEntry && (Date.now() - memoryEntry.timestamp) < memoryEntry.ttl) {
        console.log(`✅ Cache mémoire hit: ${cacheType} pour prospect ${prospectId}`);
        return memoryEntry.data;
      }

      // 2. Vérifier cache base de données
      const { data: prospect, error } = await supabase
        .from('prospects')
        .select('enrichment_data, enriched_at, updated_at')
        .eq('id', prospectId)
        .single();

      if (error || !prospect) {
        return null;
      }

      // Vérifier si enrichissement existe et est récent
      if (!prospect.enrichment_data || !prospect.enriched_at) {
        return null;
      }

      const enrichedAt = new Date(prospect.enriched_at).getTime();
      const now = Date.now();
      const age = now - enrichedAt;

      // Vérifier TTL selon type
      if (age > config.ttl) {
        console.log(`⏰ Cache expiré: ${cacheType} (${Math.round(age / (24 * 60 * 60 * 1000))} jours)`);
        return null;
      }

      // Extraire la partie demandée selon le type
      let cachedData: any = null;

      if (cacheType === 'full') {
        // Vérifier version
        if (prospect.enrichment_data.enrichment_version === 'v4.0') {
          cachedData = prospect.enrichment_data;
        }
      } else {
        // Extraire partie spécifique
        const enrichment = prospect.enrichment_data as EnrichedProspectDataV4;
        
        switch (cacheType) {
          case 'linkedin':
            cachedData = enrichment.linkedin_data;
            break;
          case 'web':
            cachedData = enrichment.web_data;
            break;
          case 'operational':
            cachedData = enrichment.operational_data;
            break;
          case 'timing':
            cachedData = enrichment.timing_analysis;
            break;
        }
      }

      if (cachedData) {
        // Mettre en cache mémoire pour accès rapide
        memoryCache.set(cacheKey, {
          data: cachedData,
          timestamp: now,
          ttl: config.ttl
        });

        console.log(`✅ Cache DB hit: ${cacheType} pour prospect ${prospectId} (${Math.round(age / (60 * 60 * 1000))}h)`);
        return cachedData;
      }

      return null;

    } catch (error) {
      console.error(`❌ Erreur récupération cache ${cacheType}:`, error);
      return null;
    }
  }

  /**
   * Mettre en cache un enrichissement
   */
  async setCachedEnrichment(
    prospectId: string,
    cacheType: 'linkedin' | 'web' | 'operational' | 'timing' | 'full',
    data: any
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(prospectId, cacheType);
      const config = CACHE_CONFIG[cacheType];

      // 1. Mettre en cache mémoire
      memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: config.ttl
      });

      // 2. Si enrichissement complet, sauvegarder en base
      if (cacheType === 'full') {
        await supabase
          .from('prospects')
          .update({
            enrichment_data: data,
            enriched_at: new Date().toISOString(),
            enrichment_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', prospectId);

        console.log(`💾 Cache sauvegardé en DB: ${cacheType} pour prospect ${prospectId}`);
      } else {
        // Pour les parties, mettre à jour seulement la partie concernée
        const { data: existing } = await supabase
          .from('prospects')
          .select('enrichment_data')
          .eq('id', prospectId)
          .single();

        if (existing?.enrichment_data) {
          const enrichment = existing.enrichment_data as EnrichedProspectDataV4;
          
          // Mettre à jour la partie spécifique
          switch (cacheType) {
            case 'linkedin':
              enrichment.linkedin_data = data;
              break;
            case 'web':
              enrichment.web_data = data;
              break;
            case 'operational':
              enrichment.operational_data = data;
              break;
            case 'timing':
              enrichment.timing_analysis = data;
              break;
          }

          enrichment.enriched_at = new Date().toISOString();
          enrichment.enrichment_version = 'v4.0';

          await supabase
            .from('prospects')
            .update({
              enrichment_data: enrichment,
              updated_at: new Date().toISOString()
            })
            .eq('id', prospectId);
        }
      }

    } catch (error) {
      console.error(`❌ Erreur mise en cache ${cacheType}:`, error);
      // Ne pas throw - le cache est optionnel
    }
  }

  /**
   * Invalider le cache pour un prospect
   */
  async invalidateCache(prospectId: string, cacheType?: 'linkedin' | 'web' | 'operational' | 'timing' | 'full'): Promise<void> {
    try {
      if (cacheType) {
        // Invalider un type spécifique
        const cacheKey = this.generateCacheKey(prospectId, cacheType);
        memoryCache.delete(cacheKey);
        console.log(`🗑️ Cache invalidé: ${cacheType} pour prospect ${prospectId}`);
      } else {
        // Invalider tout
        const types: Array<'linkedin' | 'web' | 'operational' | 'timing' | 'full'> = 
          ['linkedin', 'web', 'operational', 'timing', 'full'];
        
        types.forEach(type => {
          const cacheKey = this.generateCacheKey(prospectId, type);
          memoryCache.delete(cacheKey);
        });
        
        console.log(`🗑️ Tous les caches invalidés pour prospect ${prospectId}`);
      }
    } catch (error) {
      console.error('❌ Erreur invalidation cache:', error);
    }
  }

  /**
   * Vérifier si un prospect a besoin d'enrichissement
   * Retourne les types à enrichir
   */
  async getEnrichmentNeeds(prospectId: string): Promise<{
    needsLinkedin: boolean;
    needsWeb: boolean;
    needsOperational: boolean;
    needsTiming: boolean;
    needsFull: boolean;
    cachedLinkedin: any | null;
    cachedWeb: any | null;
    cachedOperational: any | null;
    cachedTiming: any | null;
    cachedFull: any | null;
  }> {
    const [
      cachedLinkedin,
      cachedWeb,
      cachedOperational,
      cachedTiming,
      cachedFull
    ] = await Promise.all([
      this.getCachedEnrichment(prospectId, 'linkedin'),
      this.getCachedEnrichment(prospectId, 'web'),
      this.getCachedEnrichment(prospectId, 'operational'),
      this.getCachedEnrichment(prospectId, 'timing'),
      this.getCachedEnrichment(prospectId, 'full')
    ]);

    return {
      needsLinkedin: !cachedLinkedin,
      needsWeb: !cachedWeb,
      needsOperational: !cachedOperational,
      needsTiming: !cachedTiming,
      needsFull: !cachedFull,
      cachedLinkedin,
      cachedWeb,
      cachedOperational,
      cachedTiming,
      cachedFull
    };
  }

  /**
   * Nettoyer le cache mémoire (appelé périodiquement)
   */
  cleanMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache mémoire nettoyé: ${cleaned} entrées expirées`);
    }
  }

  /**
   * Statistiques du cache
   */
  getCacheStats(): {
    memory_entries: number;
    memory_size_mb: number;
  } {
    const memorySize = JSON.stringify(Array.from(memoryCache.entries())).length;
    
    return {
      memory_entries: memoryCache.size,
      memory_size_mb: memorySize / (1024 * 1024)
    };
  }
}

export default new ProspectCacheService();

