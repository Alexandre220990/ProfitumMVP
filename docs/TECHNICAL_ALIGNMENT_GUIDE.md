# 🔧 Guide Technique Alignement Front-API-Base

## 📋 Vue d'Ensemble

Ce guide technique détaille les conventions et bonnes pratiques pour maintenir l'alignement parfait entre le frontend TypeScript, les API routes et la base de données Supabase.

## 🎯 Principes Fondamentaux

### 1. Single Source of Truth
- **Base de données** : Source de vérité pour les schémas
- **Interfaces TypeScript** : Doivent refléter exactement la base
- **API Routes** : Doivent utiliser les noms de colonnes exacts

### 2. Validation Stricte
- **Contraintes CHECK** : Définir les valeurs autorisées en base
- **Interfaces TypeScript** : Utiliser les mêmes valeurs
- **Validation API** : Vérifier les données entrantes

### 3. Conventions Cohérentes
- **Nouvelles tables** : snake_case obligatoire
- **Colonnes** : snake_case pour les nouvelles
- **Clés étrangères** : `table_name_id` format

---

## 📊 Tables et Interfaces

### CalendarEvent

#### Base de Données
```sql
CREATE TABLE "CalendarEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  type VARCHAR(20) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  category VARCHAR(20) NOT NULL DEFAULT 'client',
  client_id UUID REFERENCES "Client"(id),
  expert_id UUID REFERENCES "Expert"(id),
  created_by UUID REFERENCES "Client"(id),
  -- ... autres colonnes
);
```

#### Interface TypeScript
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  category: 'client' | 'expert' | 'admin' | 'system' | 'collaborative';
  client_id?: string;
  expert_id?: string;
  created_by?: string;
  // ... autres champs
}
```

#### API Route
```typescript
// POST /api/calendar/events
router.post('/events', async (req: Request, res: Response) => {
  const {
    title,
    description,
    start_date,
    end_date,
    type,
    priority,
    status,
    category,
    client_id,
    expert_id
  } = req.body;
  
  // Validation avec Joi
  const { error, value } = eventSchema.validate(req.body);
  
  // Insertion en base
  const { data, error: dbError } = await supabase
    .from('CalendarEvent')
    .insert({
      title,
      description,
      start_date,
      end_date,
      type,
      priority,
      status,
      category,
      client_id,
      expert_id,
      created_by: authUser.id
    })
    .select()
    .single();
});
```

### simulations

#### Base de Données
```sql
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES "Client"(id),
  session_token TEXT,
  status TEXT NOT NULL DEFAULT 'en_cours',
  type TEXT NOT NULL DEFAULT 'temporaire',
  answers JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Interface TypeScript
```typescript
interface Simulation {
  id: string;
  client_id: string;
  session_token?: string;
  status: 'en_cours' | 'termine' | 'erreur';
  type: 'temporaire' | 'authentifiee';
  answers: Record<string, any>;
  results?: Record<string, any>;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### API Route
```typescript
// POST /api/simulations
router.post('/', async (req: Request, res: Response) => {
  const { clientId, type, data } = req.body;
  
  const { data: simulation, error } = await supabase
    .from('simulations')
    .insert({
      client_id: clientId,
      type,
      answers: data,
      status: 'en_cours',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
});
```

### GEDDocument

#### Base de Données
```sql
CREATE TABLE "GEDDocument" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  file_path VARCHAR(500),
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES "Client"(id),
  is_active BOOLEAN DEFAULT true,
  read_time INTEGER DEFAULT 5,
  version INTEGER DEFAULT 1
);
```

#### Interface TypeScript
```typescript
interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: 'business' | 'technical';
  file_path?: string;
  last_modified?: string;
  created_at: string;
  created_by?: string;
  is_active?: boolean;
  read_time?: number;
  version?: number;
}
```

---

## 🔍 Scripts de Vérification

### Vérification Complète
```sql
-- server/migrations/20250105_complete_alignment_verification.sql
-- Exécuter ce script pour vérifier l'alignement complet
```

### Vérification API Routes
```sql
-- server/migrations/20250105_api_routes_verification.sql
-- Exécuter ce script pour vérifier les API routes
```

### Vérification Globale
```sql
-- server/migrations/20250105_global_alignment_check.sql
-- Exécuter ce script pour une vue d'ensemble
```

---

## 🚨 Points d'Attention

### 1. Conventions de Nommage

#### ✅ Bonnes Pratiques
```typescript
// ✅ Correct - snake_case pour les nouvelles colonnes
interface NewTable {
  user_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
```

#### ❌ À Éviter
```typescript
// ❌ Incorrect - camelCase pour les nouvelles colonnes
interface NewTable {
  userId: string;      // Devrait être user_id
  createdAt: string;   // Devrait être created_at
  isActive: boolean;   // Devrait être is_active
}
```

### 2. Valeurs Enum

#### ✅ Bonnes Pratiques
```typescript
// ✅ Correct - Valeurs alignées avec la base
interface CalendarEvent {
  type: 'appointment' | 'deadline' | 'meeting' | 'task' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}
```

#### ❌ À Éviter
```typescript
// ❌ Incorrect - Valeurs non alignées
interface CalendarEvent {
  type: 'rendez-vous' | 'reunion';  // Devrait être en anglais
  priority: 'urgent';                // Devrait être 'critical'
}
```

### 3. Clés Étrangères

#### ✅ Bonnes Pratiques
```typescript
// ✅ Correct - Noms de colonnes cohérents
interface CalendarEvent {
  client_id: string;    // Référence Client.id
  expert_id: string;    // Référence Expert.id
  created_by: string;   // Référence Client.id
}
```

#### ❌ À Éviter
```typescript
// ❌ Incorrect - Noms incohérents
interface CalendarEvent {
  clientId: string;     // Devrait être client_id
  expertId: string;     // Devrait être expert_id
  createdBy: string;    // Devrait être created_by
}
```

---

## 🔧 Procédures de Maintenance

### 1. Ajout d'une Nouvelle Table

#### Étape 1 : Créer la Table
```sql
CREATE TABLE "NewTable" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Étape 2 : Créer l'Interface TypeScript
```typescript
// client/src/types/new-table.ts
export interface NewTable {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

#### Étape 3 : Créer l'API Route
```typescript
// server/src/routes/new-table.ts
router.post('/', async (req: Request, res: Response) => {
  const { name, description, status } = req.body;
  
  const { data, error } = await supabase
    .from('NewTable')
    .insert({
      name,
      description,
      status: status || 'active'
    })
    .select()
    .single();
});
```

#### Étape 4 : Vérifier l'Alignement
```sql
-- Exécuter le script de vérification
-- server/migrations/20250105_complete_alignment_verification.sql
```

### 2. Modification d'une Table Existante

#### Étape 1 : Identifier les Impacts
```sql
-- Vérifier les contraintes existantes
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%NewTable%';
```

#### Étape 2 : Mettre à Jour la Base
```sql
-- Ajouter une nouvelle colonne
ALTER TABLE "NewTable" 
ADD COLUMN new_field VARCHAR(100);

-- Ajouter une contrainte CHECK
ALTER TABLE "NewTable" 
ADD CONSTRAINT "NewTable_status_check" 
CHECK (status IN ('active', 'inactive', 'pending'));
```

#### Étape 3 : Mettre à Jour l'Interface
```typescript
// Mettre à jour l'interface TypeScript
export interface NewTable {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending';  // Ajout de 'pending'
  new_field?: string;  // Nouvelle colonne
  created_at: string;
  updated_at: string;
}
```

#### Étape 4 : Mettre à Jour l'API
```typescript
// Mettre à jour la validation Joi
const newTableSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
  new_field: Joi.string().optional()
});
```

### 3. Suppression d'une Table

#### Étape 1 : Identifier les Dépendances
```sql
-- Vérifier les clés étrangères qui référencent cette table
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'TableToDelete';
```

#### Étape 2 : Supprimer les Dépendances
```sql
-- Supprimer les contraintes de clés étrangères
ALTER TABLE "ReferencingTable" 
DROP CONSTRAINT "ReferencingTable_table_to_delete_id_fkey";

-- Supprimer la table
DROP TABLE "TableToDelete";
```

#### Étape 3 : Mettre à Jour le Code
```typescript
// Supprimer l'interface TypeScript
// Supprimer les routes API
// Supprimer les imports
```

---

## 📊 Monitoring et Alertes

### 1. Scripts de Monitoring

#### Vérification Quotidienne
```bash
#!/bin/bash
# daily-alignment-check.sh

echo "🔍 Vérification quotidienne de l'alignement..."

# Exécuter les scripts de vérification
psql $DATABASE_URL -f server/migrations/20250105_complete_alignment_verification.sql

# Envoyer un rapport par email si des erreurs sont détectées
if [ $? -ne 0 ]; then
  echo "❌ Erreurs d'alignement détectées"
  mail -s "Alert: Alignement Front-API-Base" tech@financialtracker.fr
fi
```

#### Vérification Avant Déploiement
```bash
#!/bin/bash
# pre-deployment-check.sh

echo "🔍 Vérification avant déploiement..."

# Exécuter tous les scripts de vérification
psql $DATABASE_URL -f server/migrations/20250105_complete_alignment_verification.sql
psql $DATABASE_URL -f server/migrations/20250105_api_routes_verification.sql
psql $DATABASE_URL -f server/migrations/20250105_global_alignment_check.sql

# Bloquer le déploiement si des erreurs sont détectées
if [ $? -ne 0 ]; then
  echo "❌ Erreurs d'alignement détectées - Déploiement bloqué"
  exit 1
fi

echo "✅ Alignement vérifié - Déploiement autorisé"
```

### 2. Alertes Automatiques

#### Configuration GitHub Actions
```yaml
# .github/workflows/alignment-check.yml
name: Alignment Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  alignment-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run alignment checks
      run: |
        npm run db:check-alignment
        npm run api:check-alignment
        npm run frontend:check-alignment
    
    - name: Report results
      if: failure()
      run: |
        echo "❌ Alignement check failed"
        exit 1
```

---

## 📚 Ressources

### Documentation Officielle
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Scripts Utiles
- `server/migrations/20250105_complete_alignment_verification.sql`
- `server/migrations/20250105_api_routes_verification.sql`
- `server/migrations/20250105_global_alignment_check.sql`

### Contacts
- **Lead Developer** : tech@financialtracker.fr
- **Database Admin** : dba@financialtracker.fr
- **API Specialist** : api@financialtracker.fr

---

## ✅ Checklist de Validation

### Avant Chaque Commit
- [ ] Vérifier que les interfaces TypeScript sont alignées
- [ ] Vérifier que les API routes utilisent les bons noms de colonnes
- [ ] Vérifier que les clés étrangères sont correctes
- [ ] Exécuter les scripts de vérification

### Avant Chaque Déploiement
- [ ] Exécuter tous les scripts de vérification
- [ ] Vérifier les tests d'intégration
- [ ] Valider les migrations de base de données
- [ ] Confirmer l'alignement avec l'équipe

### Mensuellement
- [ ] Réviser les conventions de nommage
- [ ] Mettre à jour la documentation
- [ ] Analyser les performances
- [ ] Planifier les améliorations

---

*Guide technique généré le 6 Janvier 2025*
*Dernière mise à jour : 6 Janvier 2025* 