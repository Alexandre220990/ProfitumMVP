# 📋 Guide de Vérification de l'Espace Documentaire Après Migration

## 🎯 Objectif
Ce guide vous permet de vérifier manuellement que l'espace documentaire fonctionne correctement après la migration des tables en minuscules vers les tables en majuscules.

## ⚡ Vérification Rapide (5 minutes)

### 1. **Test de Connexion API**
```bash
# Lancer le script de test automatisé
./test-document-system.sh
```

### 2. **Vérification Frontend**
- Ouvrir http://localhost:3000
- Se connecter avec un compte client
- Aller dans la section "Documents"
- Vérifier que la page se charge sans erreur

### 3. **Vérification Console**
- Ouvrir les outils de développement (F12)
- Aller dans l'onglet "Console"
- Vérifier qu'il n'y a pas d'erreurs 404 ou 500

## 🔍 Vérification Complète (15 minutes)

### A. **Vérification Technique**

#### 1. **Endpoints API Critiques**
```bash
# Test des endpoints principaux
curl -X GET http://localhost:3001/api/health
curl -X GET http://localhost:3001/api/auth/check
curl -X GET http://localhost:3001/api/client-documents/client/test
```

**Résultats attendus :**
- `/health` : Status 200
- `/auth/check` : Status 401 (non authentifié)
- `/client-documents/*` : Status 401 (non authentifié)

#### 2. **Base de Données**
```sql
-- Vérifier l'existence des tables majuscules
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'DocumentFile%'
ORDER BY table_name;

-- Vérifier les données
SELECT COUNT(*) FROM "DocumentFile";
SELECT COUNT(*) FROM "DocumentFileVersion";
SELECT COUNT(*) FROM "DocumentFilePermission";
```

#### 3. **Stockage Supabase**
- Aller dans le dashboard Supabase
- Vérifier que le bucket `documents` existe
- Vérifier les politiques RLS sur les tables

### B. **Vérification Frontend**

#### 1. **Composants Principaux**
- [ ] `DocumentGrid.tsx` - Affichage des documents
- [ ] `DocumentSearch.tsx` - Recherche et filtres
- [ ] `DocumentStorage.tsx` - Upload et gestion
- [ ] `DocumentWorkflow.tsx` - Workflows métier

#### 2. **Hooks API**
- [ ] `use-document-storage.ts` - Gestion des fichiers
- [ ] `use-document-workflow.ts` - Workflows
- [ ] `use-client-documents.ts` - Documents clients

#### 3. **Fonctionnalités Critiques**

**Upload de Documents :**
1. Aller dans l'espace documentaire
2. Cliquer sur "Upload"
3. Sélectionner un fichier PDF
4. Remplir les métadonnées
5. Vérifier que le fichier apparaît dans la liste

**Téléchargement :**
1. Cliquer sur un document existant
2. Vérifier que le téléchargement fonctionne
3. Vérifier que l'URL signée est générée

**Recherche et Filtres :**
1. Utiliser la barre de recherche
2. Appliquer des filtres par catégorie
3. Vérifier que les résultats sont corrects

**Workflows :**
1. Créer une demande de document
2. Suivre le processus de validation
3. Vérifier les notifications

### C. **Vérification UX**

#### 1. **Messages d'Erreur**
- [ ] Erreurs 404/500 affichées clairement
- [ ] Messages d'erreur en français
- [ ] Suggestions d'actions correctives

#### 2. **États de Chargement**
- [ ] Spinners pendant les requêtes
- [ ] Feedback utilisateur pour les actions
- [ ] États vides bien gérés

#### 3. **Navigation**
- [ ] Liens fonctionnels
- [ ] Breadcrumbs corrects
- [ ] Redirections appropriées

## 🚨 Points de Vérification Critiques

### 1. **Sécurité**
- [ ] RLS (Row Level Security) actif
- [ ] Authentification requise
- [ ] Permissions respectées
- [ ] Audit des accès

### 2. **Données**
- [ ] Aucune donnée perdue lors de la migration
- [ ] Relations entre tables intactes
- [ ] Métadonnées complètes
- [ ] Versions des documents

### 3. **Performance**
- [ ] Temps de chargement < 3 secondes
- [ ] Pagination fonctionnelle
- [ ] Images optimisées
- [ ] Cache efficace

## 🔧 Dépannage

### Erreurs Communes

#### 1. **Erreur 404 sur les endpoints**
```bash
# Vérifier que le serveur backend tourne
ps aux | grep node
# Redémarrer si nécessaire
npm run dev:server
```

#### 2. **Erreur de connexion à la base**
```bash
# Vérifier les variables d'environnement
cat .env | grep SUPABASE
# Tester la connexion
node scripts/test-supabase-connection.js
```

#### 3. **Composants qui ne se chargent pas**
```bash
# Vérifier les dépendances
npm install
# Nettoyer le cache
npm run clean
```

#### 4. **Upload qui échoue**
- Vérifier les permissions du bucket Supabase
- Vérifier la taille maximale des fichiers
- Vérifier les types MIME autorisés

### Logs à Surveiller

#### Backend (Terminal)
```
[INFO] Document upload successful
[ERROR] Database connection failed
[WARN] File size exceeds limit
```

#### Frontend (Console)
```
GET /api/client-documents/client/123 401
POST /api/client-documents/upload 200
Error: Network request failed
```

## 📊 Métriques de Succès

### Technique
- [ ] 100% des endpoints répondent
- [ ] 0 erreur 500
- [ ] Temps de réponse < 2s
- [ ] Toutes les tables existent

### Fonctionnel
- [ ] Upload fonctionnel
- [ ] Téléchargement fonctionnel
- [ ] Recherche fonctionnelle
- [ ] Workflows opérationnels

### UX
- [ ] Interface responsive
- [ ] Messages d'erreur clairs
- [ ] Navigation intuitive
- [ ] Performance acceptable

## 🎯 Prochaines Étapes

### Si tout fonctionne :
1. ✅ Documenter les bonnes pratiques
2. ✅ Former les utilisateurs
3. ✅ Planifier la maintenance

### Si problèmes détectés :
1. 🔧 Identifier la cause racine
2. 🔧 Corriger les erreurs
3. 🔧 Re-tester complètement
4. 🔧 Documenter les corrections

## 📞 Support

En cas de problème :
1. Consulter les logs d'erreur
2. Vérifier la documentation
3. Contacter l'équipe technique
4. Ouvrir un ticket d'incident

---

**Note :** Ce guide doit être exécuté après chaque déploiement majeur pour garantir la stabilité de l'espace documentaire. 