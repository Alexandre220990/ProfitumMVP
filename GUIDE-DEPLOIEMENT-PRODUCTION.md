# 🚀 Guide de Déploiement Production - FinancialTracker V1

**Version :** 1.0  
**Date :** 3 Janvier 2025  
**Public :** Équipe Technique FinancialTracker  

---

## 🎯 Vue d'Ensemble du Déploiement

### **Architecture de Production**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Cloud)       │
│   https://app   │    │   https://api   │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Load Balancer │    │   Monitoring    │
│   (Cloudflare)  │    │   (Railway)     │    │   (Uptime)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Environnements**
- **Production** : https://financialtracker.fr
- **Staging** : https://staging.financialtracker.fr
- **Development** : http://localhost:3000

---

## 📋 Prérequis et Préparation

### **Comptes et Services Requis**

#### **Services Cloud**
- ✅ **Vercel** : Déploiement frontend
- ✅ **Railway** : Déploiement backend
- ✅ **Supabase** : Base de données et auth
- ✅ **Cloudflare** : CDN et DNS
- ✅ **Uptime Robot** : Monitoring

#### **Domaines et SSL**
- ✅ **Domaine principal** : financialtracker.fr
- ✅ **Sous-domaines** : api.financialtracker.fr
- ✅ **Certificats SSL** : Automatiques via Cloudflare
- ✅ **DNS** : Configuration Cloudflare

### **Préparation du Code**

#### **Vérifications Pré-déploiement**
```bash
# 1. Tests complets
npm run test:all

# 2. Build de production
npm run build

# 3. Linting
npm run lint

# 4. Vérification des types
npm run type-check

# 5. Audit de sécurité
npm audit
```

#### **Variables d'Environnement**
```bash
# Frontend (.env.production)
VITE_API_URL=https://api.financialtracker.fr
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_production
VITE_APP_NAME=FinancialTracker
VITE_APP_VERSION=1.0.0

# Backend (.env.production)
NODE_ENV=production
PORT=5001
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_clé_anon_production
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_production
JWT_SECRET=votre_secret_jwt_production_super_securise
CORS_ORIGIN=https://financialtracker.fr
```

---

## 🚀 Déploiement Frontend (Vercel)

### **Configuration Vercel**

#### **1. Connexion au Repository**
```bash
# Installer Vercel CLI
npm i -g vercel

# Connexion
vercel login

# Lier le projet
vercel link
```

#### **2. Configuration du Projet**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://api.financialtracker.fr",
    "VITE_SUPABASE_URL": "https://votre-projet.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "votre_clé_anon_production"
  }
}
```

#### **3. Déploiement**
```bash
# Déploiement en production
vercel --prod

# Ou via GitHub Actions
git push origin main
```

### **Configuration DNS**

#### **Cloudflare Configuration**
```
# Records DNS
Type: CNAME
Name: @
Target: cname.vercel-dns.com

Type: CNAME
Name: www
Target: cname.vercel-dns.com
```

#### **SSL Configuration**
- **Mode SSL** : Full (strict)
- **Certificat** : Automatique Cloudflare
- **HSTS** : Activé
- **Min TLS** : 1.2

---

## 🔧 Déploiement Backend (Railway)

### **Configuration Railway**

#### **1. Connexion au Repository**
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Connexion
railway login

# Lier le projet
railway link
```

#### **2. Configuration du Projet**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### **3. Variables d'Environnement**
```bash
# Configuration Railway
railway variables set NODE_ENV=production
railway variables set PORT=5001
railway variables set SUPABASE_URL=https://votre-projet.supabase.co
railway variables set SUPABASE_ANON_KEY=votre_clé_anon_production
railway variables set SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_production
railway variables set JWT_SECRET=votre_secret_jwt_production_super_securise
railway variables set CORS_ORIGIN=https://financialtracker.fr
```

#### **4. Déploiement**
```bash
# Déploiement
railway up

# Ou via GitHub Actions
git push origin main
```

### **Configuration Load Balancer**

#### **Railway Load Balancer**
- **Instances** : 2 minimum
- **Auto-scaling** : Activé
- **Health checks** : /health endpoint
- **SSL** : Automatique

---

## 🗄️ Configuration Base de Données

### **Supabase Production**

#### **1. Migration de la Base**
```bash
# Appliquer les migrations
cd server
npm run migrate:production

# Vérifier l'état
npm run db:status
```

#### **2. Configuration RLS**
```sql
-- Politiques de sécurité
CREATE POLICY "Users can view own data" ON "Client"
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Experts can view assigned clients" ON "Client"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM expertassignment 
    WHERE expert_id = auth.uid() AND client_id = id
  )
);
```

#### **3. Index de Performance**
```sql
-- Index principaux
CREATE INDEX CONCURRENTLY idx_client_email ON "Client"(email);
CREATE INDEX CONCURRENTLY idx_expert_status ON "Expert"(status);
CREATE INDEX CONCURRENTLY idx_messages_conversation ON messages(conversation_id);
CREATE INDEX CONCURRENTLY idx_messages_created_at ON messages(created_at);
```

### **Sauvegarde et Récupération**

#### **Sauvegarde Automatique**
```bash
# Script de sauvegarde
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://financialtracker-backups/
```

#### **Récupération**
```bash
# Script de récupération
#!/bin/bash
aws s3 cp s3://financialtracker-backups/backup_$DATE.sql.gz .
gunzip backup_$DATE.sql.gz
psql $DATABASE_URL < backup_$DATE.sql
```

---

## 🔐 Sécurité Production

### **Configuration Sécurité**

#### **Headers de Sécurité**
```javascript
// Middleware de sécurité
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
```

#### **Rate Limiting**
```javascript
// Configuration rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite par IP
  message: 'Trop de requêtes depuis cette IP'
});

app.use('/api/', limiter);
```

#### **CORS Configuration**
```javascript
// Configuration CORS
app.use(cors({
  origin: ['https://financialtracker.fr', 'https://www.financialtracker.fr'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **Monitoring Sécurité**

#### **Logs de Sécurité**
```javascript
// Middleware de logging
app.use((req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  };
  
  console.log(JSON.stringify(logEntry));
  next();
});
```

#### **Alertes Sécurité**
```javascript
// Détection d'anomalies
const securityAlerts = {
  failedLogins: 0,
  suspiciousActivity: [],
  
  checkFailedLogin: (ip) => {
    // Logique de détection
  },
  
  alert: (type, details) => {
    // Envoi d'alerte
  }
};
```

---

## 📊 Monitoring et Observabilité

### **Configuration Monitoring**

#### **Uptime Robot**
```yaml
# Configuration uptime
monitors:
  - name: "FinancialTracker Frontend"
    url: "https://financialtracker.fr"
    type: "http"
    interval: 5
    
  - name: "FinancialTracker API"
    url: "https://api.financialtracker.fr/health"
    type: "http"
    interval: 5
```

#### **Logs Centralisés**
```javascript
// Configuration Winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### **Métriques Performance**
```javascript
// Middleware de métriques
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordRequest(req.method, req.path, res.statusCode, duration);
  });
  
  next();
});
```

### **Alertes et Notifications**

#### **Configuration Alertes**
```javascript
// Système d'alertes
const alerts = {
  thresholds: {
    errorRate: 5, // 5% d'erreurs
    responseTime: 2000, // 2 secondes
    uptime: 99.9 // 99.9% de disponibilité
  },
  
  notify: (type, message) => {
    // Envoi Slack/Email
  }
};
```

---

## 🔄 CI/CD Pipeline

### **GitHub Actions**

#### **Workflow Frontend**
```yaml
# .github/workflows/frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths: ['client/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd client
          npm ci
          
      - name: Run tests
        run: |
          cd client
          npm test
          
      - name: Build
        run: |
          cd client
          npm run build
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### **Workflow Backend**
```yaml
# .github/workflows/backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['server/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd server
          npm ci
          
      - name: Run tests
        run: |
          cd server
          npm test
          
      - name: Run migrations
        run: |
          cd server
          npm run migrate:production
          
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

### **Tests Automatisés**

#### **Tests de Déploiement**
```javascript
// tests/deployment.test.js
describe('Production Deployment', () => {
  test('Frontend is accessible', async () => {
    const response = await fetch('https://financialtracker.fr');
    expect(response.status).toBe(200);
  });
  
  test('API health check', async () => {
    const response = await fetch('https://api.financialtracker.fr/health');
    expect(response.status).toBe(200);
  });
  
  test('Database connection', async () => {
    // Test de connexion DB
  });
});
```

---

## 🚨 Procédures d'Urgence

### **Rollback Rapide**

#### **Script de Rollback**
```bash
#!/bin/bash
# Rollback automatique

echo "🚨 Début du rollback..."

# 1. Rollback Frontend
echo "Rollback Frontend..."
vercel rollback --prod

# 2. Rollback Backend
echo "Rollback Backend..."
railway rollback

# 3. Rollback Database
echo "Rollback Database..."
psql $DATABASE_URL < backup_latest.sql

# 4. Vérification
echo "Vérification du rollback..."
curl -f https://financialtracker.fr/health || exit 1
curl -f https://api.financialtracker.fr/health || exit 1

echo "✅ Rollback terminé avec succès"
```

#### **Procédure d'Incident**
```bash
# 1. Détection
# - Monitoring automatique
# - Alertes temps réel

# 2. Évaluation
# - Gravité de l'incident
# - Impact utilisateurs
# - Temps de résolution estimé

# 3. Action
# - Rollback si nécessaire
# - Correction du problème
# - Tests de validation

# 4. Communication
# - Notification équipe
# - Communication clients
# - Post-mortem
```

### **Récupération de Données**

#### **Procédure de Récupération**
```bash
#!/bin/bash
# Récupération de données

echo "🔄 Début de la récupération..."

# 1. Identifier la sauvegarde
BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 YYYYMMDD_HHMMSS"
    exit 1
fi

# 2. Récupération
echo "Récupération de la sauvegarde $BACKUP_DATE..."
aws s3 cp s3://financialtracker-backups/backup_$BACKUP_DATE.sql.gz .

# 3. Restauration
echo "Restauration de la base..."
gunzip backup_$BACKUP_DATE.sql.gz
psql $DATABASE_URL < backup_$BACKUP_DATE.sql

# 4. Vérification
echo "Vérification de la restauration..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Client\";"

echo "✅ Récupération terminée"
```

---

## 📈 Performance et Optimisation

### **Optimisation Frontend**

#### **Configuration Vite**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@/components/ui'],
          utils: ['@/utils']
        }
      }
    },
    minify: 'terser',
    sourcemap: false
  }
});
```

#### **Optimisation Images**
```javascript
// Configuration images
const imageOptimization = {
  formats: ['webp', 'avif'],
  sizes: [640, 750, 828, 1080, 1200],
  quality: 80,
  placeholder: 'blur'
};
```

### **Optimisation Backend**

#### **Cache Redis**
```javascript
// Configuration Redis
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Middleware de cache
const cache = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

#### **Optimisation Base de Données**
```sql
-- Requêtes optimisées
EXPLAIN ANALYZE SELECT * FROM "Client" WHERE email = $1;

-- Index composites
CREATE INDEX idx_client_email_status ON "Client"(email, status);

-- Partitioning
CREATE TABLE messages_2025 PARTITION OF messages
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

## 📞 Support et Maintenance

### **Équipe de Support**

#### **Contacts Urgence**
- **Responsable Technique** : tech@financialtracker.fr
- **DevOps** : devops@financialtracker.fr
- **Support 24/7** : +33 1 XX XX XX XX

#### **Procédures de Support**
```bash
# 1. Réception incident
# - Ticket de support
# - Évaluation priorité
# - Assignation équipe

# 2. Investigation
# - Analyse logs
# - Reproduction problème
# - Identification cause

# 3. Résolution
# - Correction
# - Tests validation
# - Déploiement

# 4. Suivi
# - Monitoring
# - Documentation
# - Prévention
```

### **Maintenance Préventive**

#### **Tâches Quotidiennes**
```bash
# Script de maintenance quotidienne
#!/bin/bash

echo "🔧 Maintenance quotidienne..."

# 1. Vérification logs
echo "Vérification des logs..."
tail -n 100 /var/log/app/error.log | grep -i error

# 2. Vérification performance
echo "Vérification performance..."
curl -w "@curl-format.txt" -o /dev/null -s https://api.financialtracker.fr/health

# 3. Vérification base de données
echo "Vérification base de données..."
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

echo "✅ Maintenance terminée"
```

#### **Tâches Hebdomadaires**
```bash
# Script de maintenance hebdomadaire
#!/bin/bash

echo "🔧 Maintenance hebdomadaire..."

# 1. Nettoyage logs
echo "Nettoyage des logs..."
find /var/log/app -name "*.log" -mtime +7 -delete

# 2. Optimisation base de données
echo "Optimisation base de données..."
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# 3. Vérification sauvegardes
echo "Vérification sauvegardes..."
aws s3 ls s3://financialtracker-backups/ | tail -5

echo "✅ Maintenance terminée"
```

---

## 📋 Checklist de Déploiement

### **Pré-déploiement**
- [ ] Tests complets passent
- [ ] Code review approuvé
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] SSL certificats valides
- [ ] Monitoring configuré
- [ ] Sauvegarde récente
- [ ] Équipe notifiée

### **Déploiement**
- [ ] Déploiement frontend
- [ ] Déploiement backend
- [ ] Vérification health checks
- [ ] Tests de régression
- [ ] Validation fonctionnelle
- [ ] Performance validée
- [ ] Sécurité vérifiée

### **Post-déploiement**
- [ ] Monitoring activé
- [ ] Alertes configurées
- [ ] Documentation mise à jour
- [ ] Équipe formée
- [ ] Support prêt
- [ ] Rollback planifié

---

## 📞 Contact

### **Équipe Technique**
- **Responsable** : tech@financialtracker.fr
- **DevOps** : devops@financialtracker.fr
- **Support** : support@financialtracker.fr
- **Urgences** : +33 1 XX XX XX XX

### **Ressources**
- **Documentation** : https://docs.financialtracker.fr
- **Status** : https://status.financialtracker.fr
- **Monitoring** : https://monitoring.financialtracker.fr
- **Support** : https://support.financialtracker.fr

---

**Guide mis à jour le :** 3 Janvier 2025  
**Version :** 1.0  
**Prochaine mise à jour :** Février 2025 