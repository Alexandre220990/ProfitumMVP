import { CorsOptions } from 'cors';

// Configuration CORS unifiée et robuste
export const allowedOrigins = [
  'https://profitum.app',
  'https://www.profitum.app', 
  'https://profitum-mvp.vercel.app',
  'https://profitummvp-production.up.railway.app'
];

// Configuration CORS par rôle (pour future extensibilité)
export const corsConfigByRole = {
  client: {
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin']
  },
  expert: {
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin']
  },
  admin: {
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin']
  },
  public: {
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin']
  }
};

// Configuration CORS principale unifiée
export const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Autoriser les requêtes sans origin (ex: curl, Postman, tests)
    if (!origin) {
      console.log('🔓 CORS: Requête sans origin autorisée (tests/curl)');
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origine autorisée - ${origin}`);
      return callback(null, true);
    }
    
    // Log pour debug
    console.log(`🚫 CORS bloqué pour l'origine: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // 24 heures
};

// Configuration CORS pour développement
export const corsOptionsDev: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const devOrigins = [
      'http://[::1]:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://[::1]:5173',
      'http://localhost:5173',
      ...allowedOrigins // Inclure aussi les origines de production
    ];
    
    if (!origin) {
      console.log('🔓 CORS DEV: Requête sans origin autorisée');
      return callback(null, true);
    }
    
    if (devOrigins.includes(origin)) {
      console.log(`✅ CORS DEV: Origine autorisée - ${origin}`);
      return callback(null, true);
    }
    
    console.log(`🚫 CORS DEV bloqué pour l'origine: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400
};

// Fonction pour obtenir la configuration CORS selon l'environnement
export const getCorsConfig = (): CorsOptions => {
  return process.env.NODE_ENV === 'production' ? corsOptions : corsOptionsDev;
};

// Middleware CORS global unifié
export const corsMiddleware = (req: any, res: any, next: any) => {
  const origin = req.headers.origin;
  
  // Ajouter les headers CORS seulement si l'origine est autorisée
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin');
  
  // Log de debug pour les routes problématiques
  if (req.path.includes('/api/client/produits-eligibles') || req.path.includes('/api/simulations/check-recent')) {
    console.log(`🔍 Route appelée: ${req.method} ${req.path}`);
    console.log(`🔍 Headers:`, {
      authorization: req.headers.authorization ? 'présent' : 'absent',
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    });
  }
  
  next();
}; 