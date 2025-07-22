import { createClient, RedisClientType } from 'redis';

// Configuration Redis
const redisConfig = {
  host: process.env.REDIS_HOST || '[::1]',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

class CalendarCacheService {
  private redis: RedisClientType<any, any>;
  private isConnected: boolean = false;

  constructor(redisConfig: any) {
    this.redis = createClient(redisConfig);
    this.setupEventHandlers();
    this.redis.connect();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      this.isConnected = true;
    });
    this.redis.on('end', () => {
      this.isConnected = false;
    });
    this.redis.on('error', (err) => {
      this.isConnected = false;
      console.error('Redis error:', err);
    });
  }

  public isReady(): boolean {
    return this.isConnected && this.redis.isOpen;
  }

  public async setCache(key: string, value: any, ttl: number) {
    const safeKey = typeof key === 'string' ? key : String(key);
    await this.redis.setEx(safeKey, ttl, JSON.stringify(value));
  }

  public async getCache<T = any>(key: string): Promise<T | null> {
    const safeKey = typeof key === 'string' ? key : String(key);
    const cached = await this.redis.get(safeKey);
    if (!cached || typeof cached !== 'string') return null;
    try {
      return JSON.parse(cached) as T;
    } catch (e) {
      return null;
    }
  }

  public async delCache(...keys: any[]) {
    const safeKeys: string[] = keys.filter((k): k is string => typeof k === 'string');
    if (safeKeys.length > 0) {
      await this.redis.del(safeKeys);
    }
  }

  public async getMemoryUsage(key: string): Promise<number | null> {
    const safeKey = typeof key === 'string' ? key : String(key);
    try {
      const result = await this.redis.sendCommand(['MEMORY', 'USAGE', safeKey]);
      const strResult = result as unknown as string;
      return strResult ? parseInt(strResult, 10) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Générer une clé de cache pour les événements
   */
  private getEventsCacheKey(userId: string, filters: any = {}): string {
    const filterHash = JSON.stringify(filters);
    return `calendar:events:${userId}:${Buffer.from(filterHash).toString('base64')}`;
  }

  /**
   * Générer une clé de cache pour les étapes
   */
  private getStepsCacheKey(userId: string, filters: any = {}): string {
    const filterHash = JSON.stringify(filters);
    return `calendar:steps:${userId}:${Buffer.from(filterHash).toString('base64')}`;
  }

  /**
   * Générer une clé de cache pour les statistiques
   */
  private getStatsCacheKey(userId: string): string {
    return `calendar:stats:${userId}`;
  }

  /**
   * Mettre en cache les événements
   */
  async cacheEvents(userId: string, filters: any, events: any[], ttl: number = 300): Promise<void> {
    if (!this.isReady()) return;
    try {
      const key = this.getEventsCacheKey(userId, filters);
      await this.setCache(key, { data: events, timestamp: Date.now(), ttl }, ttl);
    } catch (error) {
      console.error('Erreur cache événements:', error);
    }
  }

  /**
   * Récupérer les événements du cache
   */
  async getCachedEvents(userId: string, filters: any = {}): Promise<any[] | null> {
    if (!this.isReady()) return null;
    try {
      const key = this.getEventsCacheKey(userId, filters);
      const cached = await this.getCache<{ data: any[]; timestamp: number; ttl: number }>(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
        return cached.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mettre en cache les étapes
   */
  async cacheSteps(userId: string, filters: any, steps: any[], ttl: number = 300): Promise<void> {
    if (!this.isReady()) return;
    try {
      const key = this.getStepsCacheKey(userId, filters);
      await this.setCache(key, { data: steps, timestamp: Date.now(), ttl }, ttl);
    } catch (error) {
      console.error('Erreur cache étapes:', error);
    }
  }

  /**
   * Récupérer les étapes du cache
   */
  async getCachedSteps(userId: string, filters: any = {}): Promise<any[] | null> {
    if (!this.isReady()) return null;
    try {
      const key = this.getStepsCacheKey(userId, filters);
      const cached = await this.getCache<{ data: any[]; timestamp: number; ttl: number }>(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
        return cached.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mettre en cache les statistiques
   */
  async cacheStats(userId: string, stats: any, ttl: number = 600): Promise<void> {
    if (!this.isReady()) return;
    try {
      const key = this.getStatsCacheKey(userId);
      await this.setCache(key, { data: stats, timestamp: Date.now(), ttl }, ttl);
    } catch (error) {
      console.error('Erreur cache statistiques:', error);
    }
  }

  /**
   * Récupérer les statistiques du cache
   */
  async getCachedStats(userId: string): Promise<any | null> {
    if (!this.isReady()) return null;
    try {
      const key = this.getStatsCacheKey(userId);
      const cached = await this.getCache<{ data: any; timestamp: number; ttl: number }>(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
        return cached.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalider le cache pour un utilisateur
   */
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.isReady()) return;

    try {
      const pattern = `calendar:*:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.delCache(...keys);
        console.log(`Cache invalidé pour l'utilisateur ${userId}: ${keys.length} clés supprimées`);
      }
    } catch (error) {
      console.error('Erreur invalidation cache:', error);
    }
  }

  /**
   * Invalider le cache pour un événement spécifique
   */
  async invalidateEventCache(eventId: string): Promise<void> {
    if (!this.isReady()) return;

    try {
      const pattern = `calendar:events:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const cached = await this.getCache(key);
        if (cached) {
          const hasEvent = cached.data?.some((event: any) => event.id === eventId);
          if (hasEvent) {
            await this.delCache(key);
          }
        }
      }
    } catch (error) {
      console.error('Erreur invalidation cache événement:', error);
    }
  }

  /**
   * Invalider le cache pour une étape spécifique
   */
  async invalidateStepCache(stepId: string): Promise<void> {
    if (!this.isReady()) return;

    try {
      const pattern = `calendar:steps:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const cached = await this.getCache(key);
        if (cached) {
          const hasStep = cached.data?.some((step: any) => step.id === stepId);
          if (hasStep) {
            await this.delCache(key);
          }
        }
      }
    } catch (error) {
      console.error('Erreur invalidation cache étape:', error);
    }
  }

  /**
   * Nettoyer le cache expiré
   */
  async cleanupExpiredCache(): Promise<void> {
    if (!this.isReady()) return;

    try {
      const pattern = `calendar:*`;
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const cached = await this.getCache(key);
        if (cached) {
          if (Date.now() - cached.timestamp >= cached.ttl * 1000) {
            await this.delCache(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cache nettoyé: ${cleanedCount} entrées expirées supprimées`);
      }
    } catch (error) {
      console.error('Erreur nettoyage cache:', error);
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getCacheStats(): Promise<any> {
    if (!this.isReady()) return null;

    try {
      const pattern = `calendar:*`;
      const keys = await this.redis.keys(pattern);
      
      const stats = {
        totalKeys: keys.length,
        eventsKeys: 0,
        stepsKeys: 0,
        statsKeys: 0,
        totalSize: 0
      };

      for (const key of keys) {
        if (key.includes(':events:')) stats.eventsKeys++;
        else if (key.includes(':steps:')) stats.stepsKeys++;
        else if (key.includes(':stats:')) stats.statsKeys++;

        const size = await this.getMemoryUsage(key);
        stats.totalSize += size || 0;
      }

      return stats;
    } catch (error) {
      console.error('Erreur statistiques cache:', error);
      return null;
    }
  }

  /**
   * Fermer la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const calendarCacheService = new CalendarCacheService(redisConfig);

// Nettoyage automatique du cache toutes les heures
setInterval(() => {
  calendarCacheService.cleanupExpiredCache();
}, 60 * 60 * 1000);

export default CalendarCacheService; 