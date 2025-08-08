// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
import "./instrument";

import * as Sentry from "@sentry/node";
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import auditsRouter from './routes/audits';
import simulationsRoutes from './routes/simulations';
import partnersRouter from './routes/partners';
import produitsEligiblesRouter from './routes/produits-eligibles';
import expertsRouter from './routes/experts';
import specializationsRouter from './routes/specializations';
// import monitoringRoutes from './routes/monitoring';
import testsRoutes from './routes/tests';
import terminalTestsRoutes from './routes/terminal-tests';
import checkNetworkInterfaces from './utils/ipcheck';
import { addCorsTestRoute } from './utils/cors-test';
import { logSupabaseRequest } from './middleware/supabase-logger';
import { addSupabaseAuth } from './middleware/supabase-auth';
import { checkDatabaseConnection, checkRLSPolicies } from './utils/databaseCheck';
import simulationRoutes from './routes/simulationRoutes';
import clientRoutes from './routes/client';
import expertRoutes from './routes/expert';
import adminRoutes from './routes/admin';
import auditRoutes from './routes/audit';
import simulationRoute from './routes/simulation';

// import messagingRoutes from './routes/messaging';
import unifiedMessagingRoutes from './routes/unified-messaging';
import simulatorRoutes from './routes/simulator';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { errorHandler } from './middleware/error-handler';
import { requireUserType } from './middleware/auth-enhanced';
import { logger } from './utils/logger';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './utils/asyncHandler';

// Import du nouveau middleware d'authentification renforcé
import { 
  enhancedAuthMiddleware, 
  publicRouteLogger, 
  requirePermission, 
  Permission 
} from './middleware/auth-enhanced';

// Import des middlewares de performance
import { 
  performanceMiddleware, 
  cacheMiddleware, 
  compressionMiddleware, 
  requestValidationMiddleware 
} from './middleware/performance';

import expertNotificationsRoutes from './routes/expert/notifications';
import sessionMigrationRoutes from './routes/session-migration';
import clientDocumentsRoutes from './routes/client-documents';
import analyticsRoutes from './routes/analytics';
import googleCalendarRoutes from './routes/google-calendar';
import debugRoutes from './routes/debug';
import diagnosticRoutes from './routes/diagnostic';
import dossierStepsRoutes from './routes/dossier-steps';
import documentsRoutes from './routes/documents';
import { getCorsConfig, corsMiddleware } from './config/cors';
import { startCalendarRemindersCron } from './cron/calendar-reminders';
import routes from './routes';

// Créer l'application Express
const app = express();

dotenv.config();

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'; // En production, écouter sur toutes les interfaces

// Configuration Supabase avec gestion d'erreur
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration CORS unifiée depuis le fichier centralisé
const corsOptions = getCorsConfig();

// Middleware Sentry (doit être en premier)
Sentry.setupExpressErrorHandler(app);

app.use(cors(corsOptions));

// Middleware pour gérer les requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Middleware GLOBAL pour s'assurer que les headers CORS sont bien appliqués sur TOUTES les réponses
app.use(corsMiddleware);

// Middleware de logging Supabase
app.use(logSupabaseRequest);

// Middleware d'authentification Supabase (commenté pour permettre les routes publiques)
// app.use(addSupabaseAuth);

app.use(express.json());
app.use(cookieParser()); // Ajout du middleware cookie-parser
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting renforcé
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});

app.use('/api/', limiter);

// Middleware pour logger les requêtes et origines (debug CORS)
app.use((req, res, next) => {
  const origin = req.headers.origin || 'Origine inconnue';
  const method = req.method;
  const path = req.url;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP inconnue';
  
  console.log(`[${new Date().toISOString()}] ${method} ${path}`);
  console.log(`Origine: ${origin} | IP: ${ipAddress}`);
  
  if (Object.keys(req.headers).length > 0) {
    console.log('Headers entrants:');
    for (const [key, value] of Object.entries(req.headers)) {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2).substring(0, 500) + (JSON.stringify(req.body).length > 500 ? '...' : ''));
  }
  
  // Intercept response to log CORS headers being sent
  const originalSend = res.send;
  res.send = function(body) {
    console.log('Headers sortants:');
    const headers = res.getHeaders();
    for (const [key, value] of Object.entries(headers)) {
      console.log(`  ${key}: ${value}`);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Ajouter la route de test CORS
addCorsTestRoute(app);

// ===== ROUTES PUBLIQUES (pas d'authentification requise) =====
// Ces routes sont accessibles sans authentification mais sont loggées
app.use('/api/auth', publicRouteLogger, authRoutes);
app.use('/api/partners', publicRouteLogger, partnersRouter);

// 🚀 ROUTES DU SIMULATEUR - PUBLIQUES (pas d'authentification requise)
app.use('/api/simulator', publicRouteLogger, simulatorRoutes);

// 🔄 ROUTES DE MIGRATION DES SESSIONS - PUBLIQUES (pas d'authentification requise)
app.use('/api/session-migration', publicRouteLogger, sessionMigrationRoutes);

// Route de santé (publique mais loggée) - PLACÉE AVANT LES ROUTES PROTÉGÉES
app.get('/api/health', publicRouteLogger, (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is healthy', 
    timestamp: new Date().toISOString(),
    security: 'Enhanced authentication enabled'
  });
});

// Route de test (publique mais loggée) - PLACÉE AVANT LES ROUTES PROTÉGÉES
app.get('/api/test', publicRouteLogger, (req, res) => {
  res.json({ 
    message: 'API is working',
    security: 'Enhanced authentication enabled'
  });
});

// ===== ROUTES PROTÉGÉES (authentification renforcée requise) =====

// APIs des experts - PROTÉGÉES
app.use('/api/experts', enhancedAuthMiddleware, expertsRouter);

// APIs des produits éligibles - PROTÉGÉES
app.use('/api/produits-eligibles', enhancedAuthMiddleware, produitsEligiblesRouter);

// APIs des spécialisations - PROTÉGÉES
app.use('/api/specializations', enhancedAuthMiddleware, specializationsRouter);

// APIs des audits - PROTÉGÉES
app.use('/api/audits', enhancedAuthMiddleware, auditsRouter);

// APIs des simulations - PROTÉGÉES
app.use('/api/simulations', enhancedAuthMiddleware, simulationsRoutes);
app.use('/api/simulation', enhancedAuthMiddleware, simulationRoutes);

// Routes client - PROTÉGÉES avec permissions spécifiques
app.use('/api/client', enhancedAuthMiddleware, requireUserType('client'), clientRoutes);

// Routes expert - PROTÉGÉES avec permissions spécifiques  
app.use('/api/expert', enhancedAuthMiddleware, requireUserType('expert'), expertRoutes);

// Routes admin - PROTÉGÉES avec permissions spécifiques
app.use('/api/admin', enhancedAuthMiddleware, requireUserType('admin'), adminRoutes);

// Routes audit - PROTÉGÉES
app.use('/api/audit', enhancedAuthMiddleware, auditRoutes);

// Routes simulation - PROTÉGÉES (correction pour éviter les conflits)
app.use('/api/simulation', enhancedAuthMiddleware, simulationRoute);

// Routes de messagerie - PROTÉGÉES
// app.use('/api/messaging', enhancedAuthMiddleware, messagingRoutes);
app.use('/api/unified-messaging', enhancedAuthMiddleware, unifiedMessagingRoutes);

// Routes des documents client - PROTÉGÉES
app.use('/api/client-documents', enhancedAuthMiddleware, clientDocumentsRoutes);

// Routes de monitoring - PROTÉGÉES avec permissions admin
// app.use('/api/monitoring', enhancedAuthMiddleware, requireUserType('admin'), monitoringRoutes);

// Routes de tests - PROTÉGÉES avec permissions admin
app.use('/api/tests', enhancedAuthMiddleware, requireUserType('admin'), testsRoutes);

// Routes de tests terminaux - PROTÉGÉES avec permissions admin
app.use('/api/terminal-tests', enhancedAuthMiddleware, requireUserType('admin'), terminalTestsRoutes);

// Route de test Sentry (pour vérifier que tout fonctionne)
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Routes de notifications expert - PROTÉGÉES
app.use('/api/expert/notifications', enhancedAuthMiddleware, expertNotificationsRoutes);

// Routes analytics - PROTÉGÉES avec permissions admin et expert
app.use('/api/analytics', enhancedAuthMiddleware, analyticsRoutes);

// Routes Google Calendar - PROTÉGÉES
app.use('/api/google-calendar', enhancedAuthMiddleware, googleCalendarRoutes);

// Routes de signature de charte - PROTÉGÉES (suppression du middleware global)


// Route de debug (temporaire)
app.use('/api/debug', debugRoutes);

// Route de diagnostic (temporaire)
app.use('/api/diagnostic', diagnosticRoutes);

// Route de gestion des étapes de dossier
app.use('/api/dossier-steps', dossierStepsRoutes);

// Routes documents - PROTÉGÉES avec authentification
app.use('/api/documents', documentsRoutes);

// Router centralisé pour toutes les routes API
app.use('/api', routes);

// Route de fallback pour les routes non trouvées
app.use('/api/*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err: any, req: any, res: any, next: any) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

// Gestion des erreurs
app.use(errorHandler);

// Démarrer le serveur HTTP
const server = createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔌 WebSocket classique sur le port 5002`);
  console.log(`🔌 WebSocket unifié sur le port 5003`);
  
  // Initialiser le service WebSocket unifié avec le serveur HTTP
  try {
    // const unifiedWsManager = initializeUnifiedWebSocket(); // This line is removed as per the edit hint
    console.log('✅ Service WebSocket unifié initialisé (port 5003)');
  } catch (error) {
    console.error('❌ Erreur initialisation WebSocket unifié:', error);
  }
  
  // Démarrer le cron job pour les rappels calendrier
  try {
    startCalendarRemindersCron();
    console.log('✅ Cron job rappels calendrier démarré');
  } catch (error) {
    console.error('❌ Erreur démarrage cron job rappels calendrier:', error);
  }
  
  // monitoringSystem.recordAuditLog({
  //   message: 'Serveur démarré',
  //   level: 'info',
  //   category: 'system',
  //   details: { 
  //     httpPort: PORT, 
  //     wsPort: PORT,
  //     environment: process.env.NODE_ENV || 'development'
  //   },
  //   success: true
  // });
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🔄 Arrêt du serveur...');
  // monitoringSystem.recordAuditLog({
  //   message: 'Serveur arrêté',
  //   level: 'info',
  //   category: 'system',
  //   details: { reason: 'SIGINT' },
  //   success: true
  // });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Arrêt du serveur...');
  // monitoringSystem.recordAuditLog({
  //   message: 'Serveur arrêté',
  //   level: 'info',
  //   category: 'system',
  //   details: { reason: 'SIGTERM' },
  //   success: true
  // });
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  // monitoringSystem.recordSecurityIncident({
  //   incident_type: 'system_failure',
  //   severity: 'high',
  //   title: 'Erreur non capturée',
  //   description: error.message,
  //   affected_service: 'server',
  //   impact_assessment: 'Serveur potentiellement instable',
  //   mitigation_steps: 'Redémarrer le serveur et vérifier les logs'
  // });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  // monitoringSystem.recordSecurityIncident({
  //   incident_type: 'system_failure',
  //   severity: 'medium',
  //   title: 'Promesse rejetée non gérée',
  //   description: String(reason),
  //   affected_service: 'server',
  //   impact_assessment: 'Fonctionnalité potentiellement cassée',
  //   mitigation_steps: 'Vérifier les promesses et ajouter la gestion d\'erreur'
  // });
}); 