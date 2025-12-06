/**
 * Service de cache Redis pour les rapports
 * Implémente le cache des résultats de rapports pour améliorer les performances
 * Implémenté selon la recommandation 5.2 de l'analyse système notifications
 */

import { Redis } from 'ioredis';
import { REPORT_LIMITS } from './base-report-service';

// Configuration Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: () => null, // Ne pas réessayer si Redis n'est pas disponible
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true
});

// Gérer les erreurs Redis silencieusement (non bloquant)
redis.on('error', (err) => {
  if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
    // Redis non disponible, continuer sans cache
    return;
  }
  console.error('❌ Erreur Redis ReportCache (non bloquant):', err.message);
});

// Ne pas connecter automatiquement si Redis n'est pas disponible
redis.connect().catch(() => {
  // Redis non disponible, continuer sans cache
});

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ReportCacheService {
  private static readonly CACHE_PREFIX = 'report:';
  private static readonly DEFAULT_TTL = REPORT_LIMITS.CACHE_TTL_SECONDS;
  
  // Cache mémoire en fallback si Redis n'est pas disponible
  private static memoryCache = new Map<string, CacheEntry<any>>();

  /**
   * Générer une clé de cache pour un rapport
   */
  private static getCacheKey(reportType: string, params: Record<string, any>): string {
    const paramsStr = JSON.stringify(params);
    const hash = Buffer.from(paramsStr).toString('base64').substring(0, 32);
    return `${this.CACHE_PREFIX}${reportType}:${hash}`;
  }

  /**
   * Vérifier si Redis est disponible
   */
  private static async isRedisAvailable(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupérer un rapport depuis le cache
   */
  static async get<T>(
    reportType: string, 
    params: Record<string, any>
  ): Promise<T | null> {
    const cacheKey = this.getCacheKey(reportType, params);

    try {
      // Essayer Redis d'abord
      if (await this.isRedisAvailable()) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          // Vérifier si l'entrée est toujours valide
          const age = Date.now() - entry.timestamp;
          if (age < entry.ttl * 1000) {
            return entry.data;
          }
          // Entry expirée, la supprimer
          await redis.del(cacheKey);
        }
      }
    } catch (error) {
      // Redis non disponible, continuer avec cache mémoire
    }

    // Fallback sur cache mémoire
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry) {
      const age = Date.now() - memoryEntry.timestamp;
      if (age < memoryEntry.ttl * 1000) {
        return memoryEntry.data as T;
      }
      // Entry expirée, la supprimer
      this.memoryCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Stocker un rapport dans le cache
   */
  static async set<T>(
    reportType: string,
    params: Record<string, any>,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const cacheKey = this.getCacheKey(reportType, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    try {
      // Essayer Redis d'abord
      if (await this.isRedisAvailable()) {
        await redis.setex(cacheKey, ttl, JSON.stringify(entry));
        return;
      }
    } catch (error) {
      // Redis non disponible, continuer avec cache mémoire
    }

    // Fallback sur cache mémoire
    this.memoryCache.set(cacheKey, entry);

    // Nettoyer le cache mémoire si trop grand (garder max 1000 entrées)
    if (this.memoryCache.size > 1000) {
      const entries = Array.from(this.memoryCache.entries());
      // Supprimer les 200 plus anciennes entrées
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 200)
        .forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Invalider le cache pour un type de rapport
   */
  static async invalidate(reportType: string, params?: Record<string, any>): Promise<void> {
    try {
      if (await this.isRedisAvailable()) {
        if (params) {
          // Invalider une entrée spécifique
          const cacheKey = this.getCacheKey(reportType, params);
          await redis.del(cacheKey);
        } else {
          // Invalider toutes les entrées de ce type de rapport
          const pattern = `${this.CACHE_PREFIX}${reportType}:*`;
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
      }
    } catch (error) {
      // Redis non disponible, ignorer
    }

    // Invalider aussi le cache mémoire
    if (params) {
      const cacheKey = this.getCacheKey(reportType, params);
      this.memoryCache.delete(cacheKey);
    } else {
      // Supprimer toutes les entrées de ce type
      const pattern = `${this.CACHE_PREFIX}${reportType}:`;
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(pattern)) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  /**
   * Nettoyer le cache expiré (pour le cache mémoire)
   */
  static cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      const age = now - entry.timestamp;
      if (age >= entry.ttl * 1000) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Obtenir des statistiques sur le cache
   */
  static async getStats(): Promise<{
    memoryEntries: number;
    redisAvailable: boolean;
  }> {
    return {
      memoryEntries: this.memoryCache.size,
      redisAvailable: await this.isRedisAvailable()
    };
  }
}

// Nettoyer le cache mémoire toutes les 5 minutes
setInterval(() => {
  ReportCacheService.cleanupExpiredEntries();
}, 5 * 60 * 1000);
