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
// Chemin vers le dossier de build du client - essayer plusieurs chemins possibles
const possiblePaths = [
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, '../../../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.join(process.cwd(), '../client/dist')
];

let clientBuildPath = null;
for (const possiblePath of possiblePaths) {
  try {
    const indexPath = path.join(possiblePath, 'index.html');
    require('fs').accessSync(indexPath, require('fs').constants.F_OK);
    clientBuildPath = possiblePath;
    console.log(`✅ Fichiers client trouvés dans: ${clientBuildPath}`);
    break;
  } catch (error) {
    console.log(`❌ Chemin non trouvé: ${possiblePath}`);
  }
}

if (!clientBuildPath) {
  console.error('❌ Aucun dossier client/dist trouvé !');
  console.log('Chemins testés:', possiblePaths);
  console.log('Dossier courant:', process.cwd());
  console.log('__dirname:', __dirname);
}

// Servir les fichiers statiques (CSS, JS, images, etc.) seulement si trouvés
if (clientBuildPath) {
  app.use(express.static(clientBuildPath));
  console.log(`📁 Fichiers statiques servis depuis: ${clientBuildPath}`);
}

// ✅ ROUTING CÔTÉ CLIENT POUR LES ROUTES REACT
// Toutes les routes qui ne commencent pas par /api doivent être servies par l'app React
app.get('*', (req, res) => {
  // Ne pas intercepter les routes API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Si les fichiers client ne sont pas trouvés, retourner une erreur
  if (!clientBuildPath) {
    console.error(`❌ Tentative d'accès à ${req.path} mais fichiers client non trouvés`);
    return res.status(500).json({ 
      error: 'Client files not found',
      message: 'Les fichiers du client React ne sont pas disponibles'
    });
  }
  
  // Servir index.html pour toutes les autres routes (routing côté client)
  const indexPath = path.join(clientBuildPath, 'index.html');
  console.log(`📄 Servir index.html pour la route: ${req.path}`);
  return res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`❌ Erreur lors du service de index.html:`, err);
      res.status(500).json({ 
        error: 'Failed to serve client',
        message: 'Impossible de servir l\'application client'
      });
    }
  });
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
