import Redis from 'ioredis';

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
  private redis: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.redis = new Redis(redisConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      console.log('✅ Redis connecté pour le cache calendrier');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Erreur Redis calendrier:', error);
      this.isConnected = false;
    });

    this.redis.on('disconnect', () => {
      console.log('⚠️ Redis déconnecté pour le cache calendrier');
      this.isConnected = false;
    });
  }

  /**
   * Vérifier si Redis est connecté
   */
  private isRedisAvailable(): boolean {
    return this.isConnected && this.redis.status === 'ready';
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
    if (!this.isRedisAvailable()) return;

    try {
      const key = this.getEventsCacheKey(userId, filters);
      await this.redis.setex(key, ttl, JSON.stringify({
        data: events,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.error('Erreur cache événements:', error);
    }
  }

  /**
   * Récupérer les événements du cache
   */
  async getCachedEvents(userId: string, filters: any = {}): Promise<any[] | null> {
    if (!this.isRedisAvailable()) return null;

    try {
      const key = this.getEventsCacheKey(userId, filters);
      const cached = await this.redis.get(key);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        // Vérifier si le cache n'est pas expiré
        if (Date.now() - parsed.timestamp < parsed.ttl * 1000) {
          return parsed.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération cache événements:', error);
      return null;
    }
  }

  /**
   * Mettre en cache les étapes
   */
  async cacheSteps(userId: string, filters: any, steps: any[], ttl: number = 300): Promise<void> {
    if (!this.isRedisAvailable()) return;

    try {
      const key = this.getStepsCacheKey(userId, filters);
      await this.redis.setex(key, ttl, JSON.stringify({
        data: steps,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.error('Erreur cache étapes:', error);
    }
  }

  /**
   * Récupérer les étapes du cache
   */
  async getCachedSteps(userId: string, filters: any = {}): Promise<any[] | null> {
    if (!this.isRedisAvailable()) return null;

    try {
      const key = this.getStepsCacheKey(userId, filters);
      const cached = await this.redis.get(key);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < parsed.ttl * 1000) {
          return parsed.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération cache étapes:', error);
      return null;
    }
  }

  /**
   * Mettre en cache les statistiques
   */
  async cacheStats(userId: string, stats: any, ttl: number = 600): Promise<void> {
    if (!this.isRedisAvailable()) return;

    try {
      const key = this.getStatsCacheKey(userId);
      await this.redis.setex(key, ttl, JSON.stringify({
        data: stats,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.error('Erreur cache statistiques:', error);
    }
  }

  /**
   * Récupérer les statistiques du cache
   */
  async getCachedStats(userId: string): Promise<any | null> {
    if (!this.isRedisAvailable()) return null;

    try {
      const key = this.getStatsCacheKey(userId);
      const cached = await this.redis.get(key);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < parsed.ttl * 1000) {
          return parsed.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération cache statistiques:', error);
      return null;
    }
  }

  /**
   * Invalider le cache pour un utilisateur
   */
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.isRedisAvailable()) return;

    try {
      const pattern = `calendar:*:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
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
    if (!this.isRedisAvailable()) return;

    try {
      const pattern = `calendar:events:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const hasEvent = parsed.data?.some((event: any) => event.id === eventId);
          if (hasEvent) {
            await this.redis.del(key);
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
    if (!this.isRedisAvailable()) return;

    try {
      const pattern = `calendar:steps:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const hasStep = parsed.data?.some((step: any) => step.id === stepId);
          if (hasStep) {
            await this.redis.del(key);
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
    if (!this.isRedisAvailable()) return;

    try {
      const pattern = `calendar:*`;
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp >= parsed.ttl * 1000) {
            await this.redis.del(key);
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
    if (!this.isRedisAvailable()) return null;

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

        const size = await this.redis.memory('USAGE', key);
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

export const calendarCacheService = new CalendarCacheService();

// Nettoyage automatique du cache toutes les heures
setInterval(() => {
  calendarCacheService.cleanupExpiredCache();
}, 60 * 60 * 1000);

export default CalendarCacheService; 