import { captureError, captureMessage, withSentry } from '../config/sentry';
import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper pour les routes Express avec Sentry
 */
export const withSentryRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  context?: {
    operation: string;
    tags?: Record<string, string>;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ajouter des informations de requête
      captureMessage(`Requête ${req.method} ${req.path}`, {
        tags: {
          method: req.method,
          path: req.path,
          operation: context?.operation || 'unknown',
          ...context?.tags
        },
        extra: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          query: req.query,
          body: req.body,
          params: req.params
        },
        level: 'info'
      });

      const result = await handler(req, res, next);

      // Ajouter un breadcrumb de succès
      captureMessage(`Requête ${req.method} ${req.path} réussie`, {
        tags: {
          method: req.method,
          path: req.path,
          operation: context?.operation || 'unknown',
          status: 'success',
          ...context?.tags
        },
        level: 'info'
      });

      return result;
    } catch (error) {
      // Capturer l'erreur avec contexte
      captureError(error, {
        tags: {
          method: req.method,
          path: req.path,
          operation: context?.operation || 'unknown',
          status: 'error',
          ...context?.tags
        },
        extra: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          query: req.query,
          body: req.body,
          params: req.params,
          error: (error as any).message
        },
        level: 'error'
      });

      throw error;
    }
  };
};

/**
 * Middleware pour capturer les erreurs de validation
 */
export const sentryValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Capturer les erreurs de validation (status 400)
    if (res.statusCode >= 400 && res.statusCode < 500) {
      captureMessage(`Erreur de validation: ${req.method} ${req.path}`, {
        tags: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode.toString(),
          type: 'validation_error'
        },
        extra: {
          response: data,
          query: req.query,
          body: req.body,
          params: req.params
        },
        level: 'warning'
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware pour capturer les erreurs serveur
 */
export const sentryServerErrorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Capturer les erreurs serveur (status 500+)
    if (res.statusCode >= 500) {
      captureMessage(`Erreur serveur: ${req.method} ${req.path}`, {
        tags: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode.toString(),
          type: 'server_error'
        },
        extra: {
          response: data,
          query: req.query,
          body: req.body,
          params: req.params
        },
        level: 'error'
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Wrapper pour les fonctions de service avec Sentry
 */
export const withSentryService = <T extends any[], R>(
  serviceFunction: (...args: T) => Promise<R>,
  serviceName: string,
  operation: string
) => {
  return withSentry(serviceFunction, {
    operation: `${serviceName}.${operation}`,
    tags: {
      service: serviceName,
      operation: operation
    }
  });
};

/**
 * Capturer les métriques de performance
 */
export const capturePerformanceMetric = (
  operation: string,
  duration: number,
  tags?: Record<string, string>
) => {
  captureMessage(`Métrique performance: ${operation}`, {
    tags: {
      type: 'performance',
      operation: operation,
      duration: duration.toString(),
      ...tags
    },
    extra: {
      duration: duration,
      operation: operation
    },
    level: 'info'
  });
};

/**
 * Capturer les événements métier
 */
export const captureBusinessEvent = (
  event: string,
  data: any,
  tags?: Record<string, string>
) => {
  captureMessage(`Événement métier: ${event}`, {
    tags: {
      type: 'business_event',
      event: event,
      ...tags
    },
    extra: {
      event: event,
      data: data
    },
    level: 'info'
  });
};

/**
 * Capturer les actions utilisateur
 */
export const captureUserAction = (
  userId: string,
  userType: string,
  action: string,
  data?: any
) => {
  captureMessage(`Action utilisateur: ${action}`, {
    user: { id: userId, type: userType },
    tags: {
      type: 'user_action',
      action: action,
      userType: userType
    },
    extra: {
      action: action,
      data: data
    },
    level: 'info'
  });
}; 