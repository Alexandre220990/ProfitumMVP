# 📚 Documentation Technique Finale - FinancialTracker V1

**Version :** 1.0  
**Date :** 3 Janvier 2025  
**Statut :** Documentation officielle V1  
**Auteur :** Équipe Technique FinancialTracker  

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Installation et Configuration](#installation-et-configuration)
4. [Structure du Code](#structure-du-code)
5. [API Documentation](#api-documentation)
6. [Base de Données](#base-de-données)
7. [Sécurité](#sécurité)
8. [Déploiement](#déploiement)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

### **Description du Projet**
FinancialTracker est une plateforme SaaS de gestion financière et d'optimisation fiscale qui connecte clients, experts et administrateurs dans un écosystème complet.

### **Fonctionnalités Principales**
- 🔐 Authentification multi-types (Client, Expert, Admin)
- 💬 Messagerie temps réel avec Supabase Realtime
- 📊 Dashboards analytics avancés
- 📁 Gestion électronique documentaire (GED)
- 🏪 Marketplace d'experts
- 📈 Système d'assignations et workflows
- 🔍 Analytics et reporting

### **Technologies Utilisées**
- **Frontend :** React 18, TypeScript, Tailwind CSS, Vite
- **Backend :** Node.js, Express, TypeScript
- **Base de données :** PostgreSQL via Supabase
- **Authentification :** Supabase Auth + JWT
- **Stockage :** Supabase Storage
- **Temps réel :** Supabase Realtime

---

## 🏗️ Architecture Technique

### **Architecture Générale**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   (React)       │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 5001    │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Middleware    │    │   Storage       │
│   Auth          │    │   (JWT, CORS)   │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Structure des Services**
```
📁 FinancialTracker/
├── 📁 client/                 # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/     # Composants UI
│   │   ├── 📁 pages/          # Pages de l'application
│   │   ├── 📁 hooks/          # Hooks personnalisés
│   │   ├── 📁 services/       # Services API
│   │   ├── 📁 types/          # Types TypeScript
│   │   └── 📁 utils/          # Utilitaires
│   └── 📁 public/             # Assets statiques
├── 📁 server/                 # Backend Express
│   ├── 📁 src/
│   │   ├── 📁 routes/         # Routes API
│   │   ├── 📁 middleware/     # Middleware
│   │   ├── 📁 services/       # Services métier
│   │   ├── 📁 types/          # Types TypeScript
│   │   └── 📁 utils/          # Utilitaires
│   └── 📁 migrations/         # Migrations DB
└── 📁 shared/                 # Code partagé
    └── 📁 types/              # Types communs
```

---

## ⚙️ Installation et Configuration

### **Prérequis**
- Node.js 18+ 
- npm ou yarn
- Git
- Compte Supabase

### **Installation Locale**

#### 1. Cloner le Repository
```bash
git clone https://github.com/votre-org/financialtracker.git
cd FinancialTracker
```

#### 2. Configuration Frontend
```bash
cd client
npm install
cp .env.example .env
```

#### 3. Configuration Backend
```bash
cd ../server
npm install
cp .env.example .env
```

#### 4. Variables d'Environnement

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5001
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
VITE_APP_NAME=FinancialTracker
VITE_APP_VERSION=1.0.0
```

**Backend (.env)**
```env
PORT=5001
NODE_ENV=development
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_supabase
JWT_SECRET=votre_secret_jwt_super_securise
CORS_ORIGIN=http://localhost:3000
```

#### 5. Base de Données
```bash
# Appliquer les migrations
cd server
npm run migrate
```

#### 6. Démarrage
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## 📁 Structure du Code

### **Frontend - Architecture React**

#### **Composants Principaux**
```typescript
// Structure des composants
📁 components/
├── 📁 ui/                     # Composants UI de base
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── 📁 messaging/              # Système de messagerie
│   ├── MessagingProvider.tsx
│   ├── ConversationList.tsx
│   └── MessageInput.tsx
├── 📁 documents/              # Gestion documentaire
│   ├── EnhancedDocumentUpload.tsx
│   └── DocumentGrid.tsx
└── 📁 dashboard/              # Dashboards
    ├── AdminDashboard.tsx
    ├── ExpertDashboard.tsx
    └── ClientDashboard.tsx
```

#### **Hooks Personnalisés**
```typescript
// Hooks principaux
📁 hooks/
├── use-auth.ts               # Authentification
├── use-supabase-messaging.ts # Messagerie temps réel
├── use-analytics.ts          # Analytics
├── use-document-storage.ts   # Gestion documents
└── use-expert.ts             # Gestion expert
```

#### **Services API**
```typescript
// Services principaux
📁 services/
├── supabase-messaging.ts     # Service messagerie
├── analyticsService.ts       # Service analytics
├── documentService.ts        # Service documents
└── expertService.ts          # Service expert
```

### **Backend - Architecture Express**

#### **Routes API**
```typescript
// Structure des routes
📁 routes/
├── auth.ts                   # Authentification
├── admin.ts                  # Routes admin
├── experts.ts                # Routes experts
├── messaging.ts              # Messagerie
├── documents.ts              # Documents
└── analytics.ts              # Analytics
```

#### **Middleware**
```typescript
// Middleware principaux
📁 middleware/
├── auth.ts                   # Authentification JWT
├── auth-enhanced.ts          # Auth avancée
├── cors.ts                   # Configuration CORS
└── validation.ts             # Validation des données
```

---

## 🔌 API Documentation

### **Authentification**

#### **POST /api/auth/login**
```typescript
// Connexion utilisateur
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "type": "client" // client, expert, admin
}

// Réponse
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "type": "client",
      "username": "username"
    }
  }
}
```

#### **POST /api/auth/register**
```typescript
// Inscription utilisateur
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "company_name": "Company Name",
  "type": "client"
}

// Réponse
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "type": "client"
    }
  }
}
```

### **Messagerie**

#### **GET /api/messaging/conversations**
```typescript
// Récupérer les conversations
GET /api/messaging/conversations
Authorization: Bearer <token>

// Réponse
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Conversation Title",
      "participant_ids": ["uuid1", "uuid2"],
      "last_message_at": "2025-01-03T10:00:00Z",
      "unread_count": 2
    }
  ]
}
```

#### **POST /api/messaging/messages**
```typescript
// Envoyer un message
POST /api/messaging/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversation_id": "uuid",
  "content": "Message content",
  "message_type": "text" // text, file, system
}

// Réponse
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Message content",
    "created_at": "2025-01-03T10:00:00Z"
  }
}
```

### **Documents**

#### **POST /api/documents/upload**
```typescript
// Upload de document
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": File,
  "category": "charte",
  "description": "Document description",
  "tags": ["tag1", "tag2"]
}

// Réponse
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "document.pdf",
    "file_size": 1024000,
    "uploaded_at": "2025-01-03T10:00:00Z"
  }
}
```

### **Analytics**

#### **GET /api/analytics/dashboard**
```typescript
// Dashboard analytics
GET /api/analytics/dashboard?timeRange=30d
Authorization: Bearer <token>

// Réponse
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "conversion-rate",
        "name": "Taux de conversion",
        "value": 23.5,
        "change": 2.1,
        "changeType": "increase"
      }
    ],
    "topProducts": [...],
    "expertPerformance": [...]
  }
}
```

---

## 🗄️ Base de Données

### **Tables Principales**

#### **Client**
```sql
CREATE TABLE "Client" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    company_name TEXT,
    phone_number TEXT,
    siren TEXT,
    type TEXT DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Expert**
```sql
CREATE TABLE "Expert" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    specializations TEXT[],
    experience INTEGER,
    rating DECIMAL(3,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Conversations**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,
    participant_ids UUID[] NOT NULL,
    title VARCHAR(200),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Messages**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Relations Clés**
- `Client` ↔ `ClientProduitEligible` (many-to-many)
- `Expert` ↔ `expertassignment` (one-to-many)
- `Client` ↔ `conversations` (many-to-many via participant_ids)
- `conversations` ↔ `messages` (one-to-many)

### **Index de Performance**
```sql
-- Index principaux
CREATE INDEX idx_client_email ON "Client"(email);
CREATE INDEX idx_expert_status ON "Expert"(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

## 🔐 Sécurité

### **Authentification**
- **JWT Tokens** avec expiration 24h
- **Supabase Auth** pour la gestion des sessions
- **Refresh tokens** automatiques
- **Logout** sécurisé avec invalidation

### **Autorisation**
- **Row Level Security (RLS)** sur toutes les tables
- **Politiques granulaires** par type d'utilisateur
- **Middleware d'authentification** sur toutes les routes sensibles
- **Validation des permissions** côté serveur

### **Protection des Données**
- **Chiffrement AES-256** au repos
- **TLS 1.3** en transit
- **Hachage bcrypt** pour les mots de passe
- **Sanitisation** des inputs utilisateur

### **Audit et Logs**
- **Logs d'accès** complets
- **Logs d'audit** pour les actions sensibles
- **Monitoring** en temps réel
- **Alertes** automatiques

---

## 🚀 Déploiement

### **Environnement de Production**

#### **Configuration Serveur**
```bash
# Variables d'environnement production
NODE_ENV=production
PORT=5001
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_clé_anon_production
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_production
JWT_SECRET=votre_secret_jwt_production_super_securise
CORS_ORIGIN=https://votre-domaine.com
```

#### **Déploiement Frontend (Vercel)**
```bash
# Configuration Vercel
cd client
vercel --prod

# Variables d'environnement Vercel
VITE_API_URL=https://api.votre-domaine.com
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_production
```

#### **Déploiement Backend (Railway)**
```bash
# Configuration Railway
cd server
railway up

# Variables d'environnement Railway
NODE_ENV=production
PORT=5001
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_clé_anon_production
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_production
JWT_SECRET=votre_secret_jwt_production_super_securise
```

### **Scripts de Déploiement**
```bash
# Script de déploiement complet
#!/bin/bash
echo "🚀 Déploiement FinancialTracker V1"

# 1. Tests
echo "📋 Exécution des tests..."
npm run test

# 2. Build
echo "🔨 Build de l'application..."
npm run build

# 3. Migration DB
echo "🗄️ Migration de la base de données..."
npm run migrate

# 4. Déploiement
echo "🚀 Déploiement en production..."
npm run deploy

echo "✅ Déploiement terminé avec succès!"
```

---

## 🔧 Maintenance

### **Tâches Quotidiennes**
- ✅ Vérification des logs d'erreur
- ✅ Monitoring des performances
- ✅ Sauvegarde automatique
- ✅ Vérification de la santé du système

### **Tâches Hebdomadaires**
- ✅ Analyse des métriques de performance
- ✅ Nettoyage des logs anciens
- ✅ Vérification des sauvegardes
- ✅ Mise à jour des dépendances

### **Tâches Mensuelles**
- ✅ Audit de sécurité
- ✅ Optimisation de la base de données
- ✅ Révision des permissions
- ✅ Mise à jour de la documentation

### **Scripts de Maintenance**
```bash
# Script de maintenance automatique
#!/bin/bash
echo "🔧 Maintenance FinancialTracker"

# 1. Nettoyage des logs
find /var/log/financialtracker -name "*.log" -mtime +30 -delete

# 2. Optimisation DB
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# 3. Vérification des sauvegardes
./scripts/verify-backup.sh

# 4. Monitoring
./scripts/health-check.sh

echo "✅ Maintenance terminée"
```

---

## 🐛 Troubleshooting

### **Problèmes Courants**

#### **Erreur de Connexion Supabase**
```bash
# Symptômes
Error: Invalid API key

# Solution
1. Vérifier les variables d'environnement
2. Vérifier la validité des clés Supabase
3. Vérifier les permissions RLS
```

#### **Erreur JWT**
```bash
# Symptômes
Error: Invalid token

# Solution
1. Vérifier la validité du token
2. Vérifier la configuration JWT_SECRET
3. Vérifier l'expiration du token
```

#### **Erreur de Messagerie**
```bash
# Symptômes
WebSocket connection failed

# Solution
1. Vérifier la configuration Supabase Realtime
2. Vérifier les permissions sur les tables
3. Vérifier la connectivité réseau
```

#### **Erreur de Performance**
```bash
# Symptômes
Slow response times

# Solution
1. Vérifier les index de la base de données
2. Optimiser les requêtes
3. Vérifier la configuration du cache
```

### **Logs et Debugging**
```bash
# Activation des logs détaillés
DEBUG=* npm run dev

# Logs spécifiques
DEBUG=financialtracker:* npm run dev

# Logs de base de données
DEBUG=supabase:* npm run dev
```

---

## 📞 Support

### **Contacts**
- **Équipe technique :** tech@financialtracker.fr
- **Support utilisateur :** support@financialtracker.fr
- **Urgences :** +33 1 XX XX XX XX

### **Ressources**
- **Documentation API :** https://api.financialtracker.fr/docs
- **Status :** https://status.financialtracker.fr
- **GitHub :** https://github.com/votre-org/financialtracker

### **Escalade**
1. **Niveau 1 :** Support utilisateur
2. **Niveau 2 :** Équipe technique
3. **Niveau 3 :** Architecte système
4. **Niveau 4 :** Direction technique

---

## 📋 Checklist de Validation

### **Pré-déploiement**
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Tests de sécurité effectués
- [ ] Performance validée
- [ ] Documentation à jour

### **Post-déploiement**
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Sauvegardes testées
- [ ] Rollback planifié
- [ ] Équipe formée

---

**Documentation mise à jour le :** 3 Janvier 2025  
**Version :** 1.0  
**Statut :** Finalisée pour V1 