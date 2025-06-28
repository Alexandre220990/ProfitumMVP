import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import auditsRouter from './routes/audits';
import simulationsRoutes from './routes/simulations';
import partnersRouter from './routes/partners';
import produitsEligiblesRouter from './routes/produits-eligibles';
import expertsRouter from './routes/experts';
import specializationsRouter from './routes/specializations';
import checkNetworkInterfaces from './utils/ipcheck';
import { addCorsTestRoute } from './utils/cors-test';
import { logSupabaseRequest } from './middleware/supabase-logger';
import { addSupabaseAuth } from './middleware/supabase-auth';
import { checkDatabaseConnection, checkRLSPolicies } from './utils/databaseCheck';
import chatbotRoutes from './routes/chatbot';
import simulationRoutes from './routes/simulationRoutes';
import chatbotTestRoutes from './routes/chatbot-test';
import clientRoutes from './routes/client';
import expertRoutes from './routes/expert';
import adminRoutes from './routes/admin';
import auditRoutes from './routes/audit';
import simulationRoute from './routes/simulation';
import charteSignatureRoutes from './routes/charte-signature';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './utils/asyncHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces

// Configuration Supabase avec gestion d'erreur
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://votre-domaine.com'] 
    : ['http://localhost:3000', 'http://[::1]:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));

// Middleware pour s'assurer que les headers CORS sont bien appliqués
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Force l'origine pour la route spécifique qui pose problème
  if (req.path === '/api/client/login') {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`🔑 Force CORS pour /api/client/login - Origine: ${origin}`);
    }
  }
  
  next();
});

// Middleware de logging Supabase
app.use(logSupabaseRequest);

// Middleware d'authentification Supabase (commenté pour permettre les routes publiques)
// app.use(addSupabaseAuth);

app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use(limiter);

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

// Routes publiques (pas d'authentification requise)
app.use('/api/auth', authRoutes);
app.use('/api/audits', auditsRouter);
app.use('/api/simulations', simulationsRoutes);
app.use('/api/partners', partnersRouter);
app.use('/api/produits-eligibles', produitsEligiblesRouter);
app.use('/api/experts', expertsRouter);
app.use('/api/specializations', specializationsRouter);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/chatbot-test', chatbotTestRoutes);

// Routes protégées (avec authentification)
app.use('/api/client', addSupabaseAuth, authMiddleware, clientRoutes);
app.use('/api/expert', addSupabaseAuth, authMiddleware, expertRoutes);
app.use('/api/admin', addSupabaseAuth, authMiddleware, adminRoutes);
app.use('/api/audit', addSupabaseAuth, authMiddleware, auditRoutes);
app.use('/api/simulation', addSupabaseAuth, authMiddleware, simulationRoute);
app.use('/api/chatbot', addSupabaseAuth, authMiddleware, chatbotRoutes);
app.use('/api/chatbot-test', addSupabaseAuth, authMiddleware, chatbotTestRoutes);

// Routes des signatures de charte (protégées par authentification)
app.use('/api', addSupabaseAuth, authMiddleware, charteSignatureRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy', timestamp: new Date().toISOString() });
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Gestion des erreurs
app.use(errorHandler);

// Écouter sur toutes les interfaces IPv4 et IPv6
async function initializeServer() {
  try {
    // Test de connexion à Supabase
    const { data, error } = await supabase.from('Client').select('count').limit(1);
    
    if (error) {
      logger.error('Erreur de connexion à Supabase:', error);
      throw error;
    }

    logger.info('✅ Connexion à Supabase établie avec succès');
    
    app.listen(PORT, '::', () => {
      console.log(`🚀 Serveur Express démarré sur http://localhost:${PORT} et http://[::1]:${PORT}`);
      console.log(`📡 Support IPv6 activé`);
      
      // Afficher toutes les interfaces réseau disponibles
      checkNetworkInterfaces();
      
      console.log(`\n🔐 Configuration CORS :`);
      console.log(`   Origines autorisées: ${process.env.NODE_ENV === 'production' ? 'production' : 'développement'}`);
      console.log(`   Credentials supportés: ${true}`);
    });
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation du serveur:', error);
    process.exit(1);
  }
}

initializeServer().catch(error => {
  console.error('❌ Erreur lors de l\'initialisation du serveur:', error);
  process.exit(1);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  logger.error('❌ Erreur non gérée:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Exception non capturée:', error);
  process.exit(1);
}); 