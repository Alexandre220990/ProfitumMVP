import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// ✅ Configuration CORS dynamique
const allowedOrigins = [
  'http://localhost:3000',
  'http://[::1]:3000',
  'http://127.0.0.1:3000'
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

// Préfixe pour toutes les routes API
app.use('/api', routes);

// Gestion des erreurs globale
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur globale:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Une erreur est survenue'
  });
});

export default app; 