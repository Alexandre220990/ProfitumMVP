import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://ee43af09b1173db4d6f3020e9ef3b35d@o4509779674923008.ingest.us.sentry.io/4509779715358720",
  
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Traces sample rate
  tracesSampleRate: 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
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
});

console.log('✅ Sentry initialisé avec succès'); 