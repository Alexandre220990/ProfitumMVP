import * as Sentry from '@sentry/node';

/**
 * Configuration globale Sentry pour tout le projet
 */
export const initializeSentry = () => {
  // Configuration de base
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://your-dsn@sentry.io/project-id',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    debug: process.env.NODE_ENV === 'development',
    
    // Configuration de sécurité
    sendDefaultPii: true,
    
    // Intégrations automatiques pour Express
    integrations: [],

    // Filtrage des erreurs
    beforeSend(event) {
      // Ignorer les erreurs de développement
      if (process.env.NODE_ENV === 'development' && event.level === 'info') {
        return null;
      }
      
      // Ajouter des tags globaux
      event.tags = {
        ...event.tags,
        service: 'profitum-server',
        version: process.env.APP_VERSION || '1.0.0',
      };
      
      return event;
    },

    // Capture des contextes
    beforeBreadcrumb(breadcrumb) {
      // Ajouter des informations utiles
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      };
      
      return breadcrumb;
    },
  });

  console.log('✅ Sentry initialisé avec succès');
};

/**
 * Capture d'erreur avec contexte enrichi
 */
export const captureError = (error: any, context?: {
  user?: { id: string; type: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: Sentry.SeverityLevel;
}) => {
  // Définir l'utilisateur si fourni
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      userType: context.user.type,
    });
  }

  // Ajouter des tags
  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  // Ajouter des données extra
  if (context?.extra) {
    Sentry.setExtra('context', context.extra);
  }

  // Capturer l'erreur
  Sentry.captureException(error, {
    level: context?.level || 'error',
  });
};

/**
 * Capture d'un message avec contexte
 */
export const captureMessage = (message: string, context?: {
  user?: { id: string; type: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: Sentry.SeverityLevel;
}) => {
  // Définir l'utilisateur si fourni
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      userType: context.user.type,
    });
  }

  // Ajouter des tags
  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  // Ajouter des données extra
  if (context?.extra) {
    Sentry.setExtra('context', context.extra);
  }

  // Capturer le message
  Sentry.captureMessage(message, {
    level: context?.level || 'info',
  });
};

/**
 * Middleware Express pour Sentry (simplifié)
 */
export const sentryMiddleware = {
  // Middleware pour capturer les erreurs
  errorHandler: (err: any, req: any, res: any, next: any) => {
    Sentry.captureException(err);
    next(err);
  },
  
  // Middleware pour tracer les requêtes
  requestHandler: (req: any, res: any, next: any) => {
    Sentry.addBreadcrumb({
      message: `${req.method} ${req.path}`,
      category: 'http',
      level: 'info',
      data: { url: req.url, method: req.method },
    });
    next();
  },
};

/**
 * Wrapper pour les fonctions async avec capture d'erreur automatique
 */
export const withSentry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: {
    operation: string;
    user?: { id: string; type: string };
    tags?: Record<string, string>;
  }
) => {
  return async (...args: T): Promise<R> => {
    // Ajouter un breadcrumb pour tracer l'opération
    if (context?.operation) {
      Sentry.addBreadcrumb({
        message: `Début opération: ${context.operation}`,
        category: 'operation',
        level: 'info',
        data: { args },
      });
    }

    try {
      // Définir l'utilisateur si fourni
      if (context?.user) {
        Sentry.setUser({
          id: context.user.id,
          userType: context.user.type,
        });
      }

      // Ajouter des tags
      if (context?.tags) {
        Sentry.setTags(context.tags);
      }

      const result = await fn(...args);

      // Ajouter un breadcrumb de succès
      Sentry.addBreadcrumb({
        message: `Opération ${context?.operation || 'unknown'} réussie`,
        category: 'operation',
        level: 'info',
        data: { args, result },
      });

      return result;
    } catch (error) {
      // Capturer l'erreur avec contexte
      captureError(error, {
        user: context?.user,
        tags: context?.tags,
        extra: { args, operation: context?.operation },
        level: 'error',
      });

      throw error;
    }
  };
};

/**
 * Décorateur pour les classes avec Sentry
 */
export const withSentryClass = <T extends { new (...args: any[]): any }>(
  constructor: T,
  context?: {
    service: string;
    tags?: Record<string, string>;
  }
) => {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      
      // Ajouter des tags de classe
      if (context?.tags) {
        Sentry.setTags({
          service: context.service,
          ...context.tags,
        });
      }
    }
  };
};

export default Sentry; 