import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Configuration Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || '[::1]',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

interface CacheOptions {
  ttl?: number; // Time to live en secondes
  key?: string; // Clé personnalisée
  condition?: (req: Request) => boolean; // Condition pour activer le cache
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, key, condition } = options; // 5 minutes par défaut

  return async (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si le cache doit être activé
    if (condition && !condition(req)) {
      return next();
    }

    // Générer la clé de cache
    const cacheKey = key || `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${JSON.stringify(req.body)}`;

    try {
      // Vérifier si les données sont en cache
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log(`📦 Cache hit: ${cacheKey}`);
        return res.json(parsedData);
      }

      // Intercepter la réponse pour la mettre en cache
      const originalSend = res.send;
      res.send = function(body) {
        try {
          if (res.statusCode === 200 && typeof body === 'string') {
            const parsedBody = JSON.parse(body);
            redis.setex(cacheKey, ttl, JSON.stringify(parsedBody));
            console.log(`💾 Cache miss - stored: ${cacheKey}`);
          }
        } catch (error) {
          console.warn('⚠️ Erreur mise en cache:', error);
        }
        
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('❌ Erreur cache Redis:', error);
      next(); // Continuer sans cache en cas d'erreur
    }
  };
}

// Middleware pour invalider le cache
export function invalidateCache(pattern: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Cache invalidé: ${keys.length} clés supprimées`);
      }
    } catch (error) {
      console.error('❌ Erreur invalidation cache:', error);
    }
    next();
  };
}

// Fonction utilitaire pour nettoyer le cache
export async function clearCache(pattern: string = 'cache:*') {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cache nettoyé: ${keys.length} clés supprimées`);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error('❌ Erreur nettoyage cache:', error);
    return 0;
  }
}

// Fonction pour obtenir les statistiques du cache
export async function getCacheStats() {
  try {
    const info = await redis.info();
    const keys = await redis.keys('cache:*');
    
    return {
      totalKeys: keys.length,
      memoryUsage: info.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'N/A',
      hitRate: info.match(/keyspace_hits:(\d+)/)?.[1] || '0',
      missRate: info.match(/keyspace_misses:(\d+)/)?.[1] || '0'
    };
  } catch (error) {
    console.error('❌ Erreur statistiques cache:', error);
    return null;
  }
}

// Middleware pour les statistiques de cache
export function cacheStatsMiddleware() {
  return async (req: Request, res: Response) => {
    const stats = await getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  };
}

export default redis; 