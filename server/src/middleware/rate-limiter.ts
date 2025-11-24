/**
 * Middleware de rate limiting pour protéger contre les attaques brute force
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter pour les routes de login
 * Limite: 5 tentatives par 15 minutes par IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limite temporairement augmentée à 50 requêtes par fenêtre (pour développement)
  standardHeaders: true, // Retourne les informations de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Compte aussi les requêtes réussies
  skipFailedRequests: false, // Compte aussi les requêtes échouées
  handler: (req, res) => {
    console.log(`🚫 Rate limit dépassé pour IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60 // En secondes
    });
  }
});

/**
 * Rate limiter pour les routes d'inscription
 * Limite: 3 tentatives par heure par IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Limite de 3 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 Rate limit inscription dépassé pour IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60 // En secondes
    });
  }
});

/**
 * Rate limiter strict pour les routes sensibles
 * Limite: 10 tentatives par heure par IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Limite de 10 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 Rate limit strict dépassé pour IP: ${req.ip} sur route: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes. Veuillez réessayer plus tard.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60 // En secondes
    });
  }
});

/**
 * Rate limiter général pour toutes les API
 * Limite: 100 requêtes par 15 minutes par IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting pour les health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  handler: (req, res) => {
    console.log(`🚫 Rate limit général dépassé pour IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes. Veuillez réessayer dans 15 minutes.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60 // En secondes
    });
  }
});

