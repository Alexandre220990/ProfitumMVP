import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';

// Routes
import authRoutes from './routes/auth';
import auditsRouter from './routes/audits';
import simulationsRoutes from './routes/simulations';
import partnersRouter from './routes/partners';
import produitsEligiblesRouter from './routes/produits-eligibles';
import expertsRouter from './routes/experts';
import specializationsRouter from './routes/specializations';
import simulationRoutes from './routes/simulationRoutes';
import clientRoutes from './routes/client';
import expertRoutes from './routes/expert';
import adminRoutes from './routes/admin';
import auditRoutes from './routes/audit';
// SUPPRIMÉ: import simulationRoute from './routes/simulation'; (fichier obsolète, doublon de simulationRoutes)


// Middlewares
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import { 
  enhancedAuthMiddleware, 
  publicRouteLogger, 
  requireUserType
} from './middleware/auth-enhanced';
import { 
  performanceMiddleware, 
  cacheMiddleware, 
  requestValidationMiddleware 
} from './middleware/performance';

// Utils
import checkNetworkInterfaces from './utils/ipcheck';
import { addCorsTestRoute } from './utils/cors-test';
import { getCorsConfig, corsMiddleware } from './config/cors';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5004;

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===== CONFIGURATION DES MIDDLEWARES =====

// Configuration CORS unifiée depuis le fichier centralisé
const corsOptions = getCorsConfig();

app.use(cors(corsOptions));

// Middleware pour gérer les requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Middleware GLOBAL pour s'assurer que les headers CORS sont bien appliqués
app.use(corsMiddleware);

// Middleware de compression pour améliorer les performances
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware de sécurité renforcé
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware de performance global
app.use(performanceMiddleware);

// Middleware de validation des requêtes
app.use(requestValidationMiddleware);

// Middleware pour les headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.path === '/api/client/login') {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      logger.info(`🔑 Force CORS pour /api/client/login - Origine: ${origin}`);
    }
  }
  
  next();
});

// Parsing des requêtes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging optimisé
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ===== RATE LIMITING =====

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite plus stricte pour l'authentification
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite plus élevée pour les APIs
  message: {
    success: false,
    message: 'Limite d\'API dépassée, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer les rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// ===== LOGGING EN DÉVELOPPEMENT =====

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const origin = req.headers.origin || 'Origine inconnue';
    const method = req.method;
    const path = req.url;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP inconnue';
    
    logger.info(`[${new Date().toISOString()}] ${method} ${path} - ${origin} | ${ipAddress}`);
    
    // Intercepter la réponse pour logger les headers
    const originalSend = res.send;
    res.send = function(body) {
      const headers = res.getHeaders();
      logger.debug('Headers sortants:', headers);
      return originalSend.call(this, body);
    };
    
    next();
  });
}

// Ajouter la route de test CORS
addCorsTestRoute(app);

// ===== ROUTES PUBLIQUES (avec cache) =====

app.use('/api/auth', publicRouteLogger, cacheMiddleware(2 * 60 * 1000), authRoutes); // 2 min cache
app.use('/api/simulations', publicRouteLogger, cacheMiddleware(5 * 60 * 1000), simulationsRoutes); // 5 min cache
app.use('/api/partners', publicRouteLogger, cacheMiddleware(10 * 60 * 1000), partnersRouter); // 10 min cache
app.use('/api/simulations', publicRouteLogger, simulationRoutes);

// ===== ROUTES PROTÉGÉES (avec cache) =====

app.use('/api/experts', enhancedAuthMiddleware, cacheMiddleware(5 * 60 * 1000), expertsRouter);
app.use('/api/produits-eligibles', cacheMiddleware(10 * 60 * 1000), produitsEligiblesRouter); // Middleware auth géré route par route
app.use('/api/specializations', enhancedAuthMiddleware, cacheMiddleware(30 * 60 * 1000), specializationsRouter); // 30 min cache
app.use('/api/audits', enhancedAuthMiddleware, auditsRouter);

// Routes avec permissions spécifiques
app.use('/api/client', enhancedAuthMiddleware, requireUserType('client'), clientRoutes);
app.use('/api/expert', enhancedAuthMiddleware, requireUserType('expert'), expertRoutes);
app.use('/api/admin', enhancedAuthMiddleware, requireUserType('admin'), adminRoutes);
app.use('/api/audit', enhancedAuthMiddleware, auditRoutes);
// SUPPRIMÉ: app.use('/api/simulation', enhancedAuthMiddleware, simulationRoute); (doublon avec ligne 205)


// ===== ROUTES DE SYSTÈME =====

// Route de santé
app.get('/api/health', publicRouteLogger, (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is healthy', 
    timestamp: new Date().toISOString(),
    security: 'Enhanced authentication enabled',
    performance: 'Optimized with caching and compression',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route de test
app.get('/api/test', publicRouteLogger, (req, res) => {
  res.json({ 
    message: 'API is working',
    security: 'Enhanced authentication enabled',
    performance: 'Optimized'
  });
});

// Route de métriques de performance (protégée)
app.get('/api/metrics', enhancedAuthMiddleware, requireUserType('admin'), (req, res) => {
  res.json({
    cache: {
      size: 0, // À implémenter avec getCacheStats()
      hitRate: 0
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

// ===== GESTION DES ERREURS =====

app.use(errorHandler);

// ===== INITIALISATION DU SERVEUR =====

async function initializeServer() {
  try {
    // Test de connexion à Supabase
    const { data, error } = await supabase.from('Client').select('count').limit(1);
    
    if (error) {
      logger.error('Erreur de connexion à Supabase:', error);
      throw error;
    }

    logger.info('✅ Connexion à Supabase établie avec succès');
    
    app.listen(PORT, process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::', () => {
      console.log(`🚀 Serveur Express optimisé démarré sur http://[::1]:${PORT}`);
      console.log(`🔌 WebSocket classique sur le port 5002`);
      console.log(`🔌 WebSocket unifié sur le port 5003`);
      console.log(`📡 Support IPv6 activé`);
      console.log(`🔐 Authentification renforcée activée`);
      console.log(`⚡ Optimisations de performance activées`);
      
      checkNetworkInterfaces();
      
      console.log(`\n🔐 Configuration optimisée :`);
      console.log(`   Origines autorisées: ${process.env.NODE_ENV === 'production' ? 'production' : 'développement'}`);
      console.log(`   Credentials supportés: ${true}`);
      console.log(`   Rate limiting: 100 req/15min par IP`);
      console.log(`   Compression: Activée`);
      console.log(`   Cache: Activé pour les routes publiques`);
      console.log(`   Logs d'accès: Activés pour conformité ISO`);
    });
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation du serveur:', error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  logger.error('❌ Erreur non gérée:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Démarrer le serveur
initializeServer().catch(error => {
  console.error('❌ Erreur lors de l\'initialisation du serveur:', error);
  process.exit(1);
});

export default app; 