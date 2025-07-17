import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  startTime: number;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
}

// Cache pour les requêtes fréquentes
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Configuration du cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const metrics: PerformanceMetrics = {
    startTime,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown'
  };

  // Ajouter les métriques à la requête
  (req as any).performanceMetrics = metrics;

  // Intercepter la réponse pour mesurer le temps
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Log des performances pour les requêtes lentes (> 1 seconde)
    if (duration > 1000) {
      logger.warn(`🐌 Requête lente détectée: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log des performances pour les requêtes très lentes (> 5 secondes)
    if (duration > 5000) {
      logger.error(`🚨 Requête très lente: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Ajouter le header de performance
    res.set('X-Response-Time', `${duration}ms`);
    
    return originalSend.call(this, body);
  };

  next();
};

// Middleware de cache pour les requêtes GET
export const cacheMiddleware = (ttl: number = CACHE_TTL) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    const cached = queryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.info(`💾 Cache hit: ${req.path}`);
      return res.json(cached.data);
    }

    // Intercepter la réponse pour mettre en cache
    const originalSend = res.send;
    res.send = function(body) {
      try {
        const data = JSON.parse(body);
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });

        // Nettoyer le cache si nécessaire
        if (queryCache.size > MAX_CACHE_SIZE) {
          const oldestKey = queryCache.keys().next().value;
          if (oldestKey) {
            queryCache.delete(oldestKey);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de parsing JSON
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

// Fonction pour nettoyer le cache
export const clearCache = () => {
  queryCache.clear();
  logger.info('🧹 Cache nettoyé');
};

// Fonction pour obtenir les statistiques du cache
export const getCacheStats = () => {
  return {
    size: queryCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: 0 // À implémenter avec un compteur
  };
};

// Middleware de compression conditionnelle
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = req.get('Accept-Encoding');
  
  if (acceptEncoding && acceptEncoding.includes('gzip')) {
    // Activer la compression pour les réponses JSON
    res.set('Content-Encoding', 'gzip');
  }
  
  next();
};

// Middleware de validation des requêtes
export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Valider la taille du body
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Payload trop volumineux'
    });
  }

  // Valider les headers requis
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type application/json requis'
      });
    }
  }

  next();
}; 