import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
// import { monitoringSystem } from '../lib/monitoring-system';

// Routes pour les documents clients
import clientDocumentsRouter from './routes/enhanced-client-documents';

const app = express();

// ✅ Configuration CORS dynamique
const allowedOrigins = [
  'http://[::1]:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://[::1]:5173',
  'http://localhost:5173',
  'https://profitum-mvp.vercel.app',
  'https://profitum.app',
  'https://www.profitum.app',
  'https://profitummvp-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (ex: curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware de monitoring pour enregistrer les logs d'audit
app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  // Enregistrer le log d'audit après la réponse
  res.on('finish', async () => {
    try {
      // await monitoringSystem.recordAuditLog({
      //   message: `${req.method} ${req.path}`,
      //   level: res.statusCode < 400 ? 'info' : 'error',
      //   category: 'api',
      //   details: {
      //     status_code: res.statusCode,
      //     response_time_ms: Date.now() - startTime,
      //     method: req.method,
      //     path: req.path
      //   },
      //   ip_address: req.ip,
      //   user_email: req.get('User-Agent'),
      //   resource_type: 'api',
      //   resource_id: req.path,
      //   success: res.statusCode < 400
      // });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log d\'audit:', error);
    }
  });
  
  next();
});

// Préfixe pour toutes les routes API
app.use('/api', routes); // DÉCOMMENTÉ pour exposer toutes les routes sous /api

// ✅ SERVIR LES FICHIERS STATIQUES DU CLIENT REACT
// Chemin vers le dossier de build du client
const clientBuildPath = path.join(__dirname, '../client/dist');

// Servir les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(clientBuildPath));

// ✅ ROUTING CÔTÉ CLIENT POUR LES ROUTES REACT
// Toutes les routes qui ne commencent pas par /api doivent être servies par l'app React
app.get('*', (req, res) => {
  // Ne pas intercepter les routes API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Servir index.html pour toutes les autres routes (routing côté client)
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Gestion des erreurs globale
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur globale:', err);
  
  // Enregistrer l'erreur comme incident de sécurité si critique
  if (err.status >= 500) {
    // monitoringSystem.recordSecurityIncident({
    //   incident_type: 'system_failure',
    //   severity: 'high',
    //   title: 'Erreur serveur critique',
    //   description: `Erreur ${err.status}: ${err.message}`,
    //   affected_service: 'api',
    //   impact_assessment: 'Service temporairement indisponible',
    //   mitigation_steps: 'Vérifier les logs et redémarrer le service si nécessaire'
    // }).catch(console.error);
  }
  
  res.status(500).json({
    success: false,
    message: err.message || 'Une erreur est survenue'
  });
});

// Arrêter proprement le système de monitoring à la fermeture
process.on('SIGINT', () => {
  console.log('Arrêt du serveur...');
  // monitoringSystem.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Arrêt du serveur...');
  // monitoringSystem.stop();
  process.exit(0);
});

export default app;
