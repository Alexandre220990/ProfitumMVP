# 🚀 Guide de Démarrage Rapide - Gestion Électronique Documentaire (GED)

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la mise en place et l'utilisation du système de Gestion Électronique Documentaire (GED) de FinancialTracker.

## 🎯 Fonctionnalités implémentées

### ✅ Phase 1 : Base de données et API (Terminée)
- [x] Tables SQL pour documents, labels, permissions, versions, favoris
- [x] API REST complète avec authentification
- [x] Gestion des permissions par profil utilisateur
- [x] Système de versions automatique
- [x] Recherche et filtrage avancés
- [x] Gestion des favoris utilisateur

### 🔄 Phase 2 : Interface Frontend (En cours)
- [ ] Composants React pour la gestion des documents
- [ ] Intégration dans les dashboards existants
- [ ] Interface de création/modification de documents
- [ ] Système de labels visuels

### 📈 Phase 3 : Fonctionnalités avancées (Planifiée)
- [ ] Export PDF/Markdown
- [ ] Notifications en temps réel
- [ ] Métriques et analytics
- [ ] Workflows d'approbation

## 🛠️ Installation et Configuration

### 1. Prérequis
```bash
# Vérifier que vous êtes dans le dossier server
cd server

# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### 2. Application de la migration
```bash
# Appliquer la migration de base de données
node scripts/apply-ged-migration.js
```

### 3. Démarrage du serveur
```bash
# Démarrer le serveur avec la GED
./start-ged-server.sh

# Ou manuellement
npm run dev
```

## 🧪 Tests de l'API

### Test rapide
```bash
# Tester toutes les fonctionnalités
node test-ged-api.js
```

### Tests manuels avec curl
```bash
# Lister les documents
curl -X GET "http://localhost:3001/api/documents" \
  -H "Authorization: Bearer test-token-admin" \
  -H "X-User-Type: admin"

# Créer un document
curl -X POST "http://localhost:3001/api/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-admin" \
  -H "X-User-Type: admin" \
  -d '{
    "title": "Test Document",
    "description": "Document de test",
    "content": "<h1>Test</h1><p>Contenu de test</p>",
    "category": "technical",
    "read_time": 3
  }'

# Lister les labels
curl -X GET "http://localhost:3001/api/documents/labels" \
  -H "Authorization: Bearer test-token-admin" \
  -H "X-User-Type: admin"
```

## 📊 Structure de la base de données

### Tables créées
1. **Document** - Documents principaux
2. **DocumentLabel** - Labels/tags pour catégoriser
3. **DocumentLabelRelation** - Liaison documents-labels
4. **DocumentPermission** - Permissions par profil
5. **DocumentVersion** - Historique des versions
6. **UserDocumentFavorite** - Favoris utilisateur

### Labels par défaut
- `admin` - Documentation pour les administrateurs
- `client` - Documentation pour les clients
- `expert` - Documentation pour les experts
- `guide` - Guides d'utilisation
- `fonctionnalités` - Description des fonctionnalités
- `processus` - Processus métier
- `métier` - Documentation métier
- `sécurité` - Documentation sécurité
- `api` - Documentation API
- `architecture` - Architecture technique
- `déploiement` - Guides de déploiement
- `tests` - Documentation des tests
- `ged` - Gestion Électronique Documentaire
- `documentation` - Documentation générale
- `implémentation` - Guides d'implémentation
- `base-de-données` - Documentation base de données
- `iso` - Conformité ISO

## 🔐 Gestion des permissions

### Profils utilisateur
- **Admin** : Accès complet (lecture, écriture, suppression, partage)
- **Expert** : Lecture, écriture (documents métier uniquement), partage
- **Client** : Lecture, partage

### Permissions par défaut
```sql
-- Admin
can_read: true, can_write: true, can_delete: true, can_share: true

-- Expert  
can_read: true, can_write: true, can_delete: false, can_share: true

-- Client
can_read: true, can_write: false, can_delete: false, can_share: true
```

## 📡 API Endpoints

### Documents
- `GET /api/documents` - Lister avec filtres et pagination
- `POST /api/documents` - Créer un document
- `GET /api/documents/:id` - Récupérer un document
- `PUT /api/documents/:id` - Modifier un document
- `DELETE /api/documents/:id` - Supprimer un document

### Labels
- `GET /api/documents/labels` - Lister tous les labels
- `POST /api/documents/labels` - Créer un label

### Favoris
- `POST /api/documents/:id/favorite` - Ajouter aux favoris
- `DELETE /api/documents/:id/favorite` - Retirer des favoris
- `GET /api/documents/favorites` - Récupérer les favoris

### Paramètres de requête
```javascript
// Filtres disponibles
{
  category: 'business' | 'technical',
  search: 'mot-clé',
  labels: ['label1', 'label2'],
  page: 1,
  limit: 10,
  sortBy: 'title' | 'created_at' | 'last_modified' | 'read_time',
  sortOrder: 'asc' | 'desc'
}
```

## 🔍 Recherche et filtrage

### Recherche textuelle
- Recherche dans le titre, description et contenu
- Support des expressions régulières PostgreSQL
- Recherche insensible à la casse

### Filtres disponibles
- **Catégorie** : business, technical
- **Labels** : Filtrage par un ou plusieurs labels
- **Pagination** : page, limit
- **Tri** : Par titre, date de création, dernière modification, temps de lecture

### Exemples de requêtes
```javascript
// Recherche par mot-clé
GET /api/documents?search=guide

// Filtre par catégorie
GET /api/documents?category=technical

// Filtre par labels
GET /api/documents?labels=admin,guide

// Tri et pagination
GET /api/documents?sortBy=title&sortOrder=asc&page=1&limit=5
```

## 📈 Métriques et analytics

### Métriques disponibles
- Nombre total de documents
- Répartition par catégorie
- Répartition par label
- Temps de lecture moyen
- Nombre de vues par document
- Nombre de favoris par document

### Endpoint de statistiques
```javascript
// À implémenter dans la prochaine phase
GET /api/documents/stats
```

## 🚨 Dépannage

### Erreurs courantes

#### 1. "Variables d'environnement manquantes"
```bash
# Vérifier les variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Définir les variables si manquantes
export SUPABASE_URL="votre_url_supabase"
export SUPABASE_SERVICE_ROLE_KEY="votre_clé_service"
```

#### 2. "Tables non trouvées"
```bash
# Appliquer la migration
node scripts/apply-ged-migration.js
```

#### 3. "Erreur de connexion à l'API"
```bash
# Vérifier que le serveur est démarré
curl http://localhost:3001/api/auth/health

# Redémarrer le serveur si nécessaire
npm run dev
```

#### 4. "Permissions insuffisantes"
```bash
# Vérifier le type d'utilisateur dans les headers
curl -H "X-User-Type: admin" ...
```

### Logs utiles
```bash
# Logs du serveur
tail -f logs/server.log

# Logs de la base de données
tail -f logs/database.log
```

## 🔄 Prochaines étapes

### Phase 2 : Interface Frontend
1. Créer les composants React pour la gestion des documents
2. Intégrer dans les dashboards existants (Admin, Client, Expert)
3. Implémenter l'interface de création/modification
4. Ajouter le système de labels visuels

### Phase 3 : Fonctionnalités avancées
1. Export PDF/Markdown
2. Notifications en temps réel
3. Métriques et analytics détaillés
4. Workflows d'approbation
5. Commentaires et collaboration

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs du serveur
2. Vérifier la documentation technique
3. Tester avec les scripts fournis
4. Contacter l'équipe de développement

---

**Version** : 1.0.0  
**Date** : 2025-01-27  
**Auteur** : FinancialTracker Team 