# 📚 RÉFÉRENCE COMPLÈTE DU SCHÉMA DE BASE DE DONNÉES

**Date de génération** : 1er octobre 2025  
**Source** : Analyse Supabase en production  
**Statut** : ✅ Documentation officielle à jour

---

## 🎯 **RÉSUMÉ STATISTIQUES**

| Métrique | Valeur |
|----------|--------|
| **Tables totales** | 73 |
| **Vues** | 13 |
| **Colonnes totales** | ~1100+ |
| **Clés étrangères** | 65 |
| **Index** | 300+ |
| **Fonctions** | 30+ |
| **Triggers** | 55 |
| **Politiques RLS** | 120+ |

---

## 📊 **TABLES PRINCIPALES (TOP 10 PAR UTILISATION)**

| Rang | Table | Lignes | Scans | Taille |
|------|-------|--------|-------|--------|
| 1 | **system_metrics** | 46,214 | 213 | Très grande |
| 2 | **audit_logs** | 1,907 | 202 | Grande |
| 3 | **documentation_items** | 52 | 200 | Moyenne |
| 4 | **conversations** | 25 | 1,035 | Petite |
| 5 | **QuestionnaireQuestion** | 20 | 382 | Petite |
| 6 | **Client** | 13 | 26,664 | Moyenne |
| 7 | **Expert** | 12 | 2,455 | Moyenne |
| 8 | **ProduitEligible** | 10 | 3,313 | Petite |
| 9 | **expertassignment** | 6 | 980 | Petite |
| 10 | **ClientProduitEligible** | 2 | 3,700 | Petite |

---

## 🔑 **TABLES CORE BUSINESS**

### **1. Admin**
**Colonnes** : 9  
**Lignes** : 1

| Colonne | Type | Nullable | Défaut |
|---------|------|----------|--------|
| id | uuid | ❌ | gen_random_uuid() |
| email | text | ❌ | - |
| password | text | ✅ | - |
| name | text | ❌ | - |
| role | text | ✅ | 'admin'::text |
| last_login | timestamp without time zone | ✅ | - |
| created_at | timestamp without time zone | ✅ | now() |
| updated_at | timestamp without time zone | ✅ | now() |
| **auth_id** | uuid | ✅ | - |

**Index** :
- `Admin_pkey` (PRIMARY KEY sur id)
- `Admin_email_key` (UNIQUE sur email)
- `Admin_auth_id_key` (UNIQUE sur auth_id)
- `idx_admin_auth_id`

---

### **2. Client**
**Colonnes** : 33  
**Lignes** : 13

| Colonne | Type | Nullable | Casse Importante |
|---------|------|----------|------------------|
| id | uuid | ❌ | - |
| email | text | ❌ | - |
| password | text | ❌ | - |
| name | text | ✅ | - |
| company_name | text | ✅ | - |
| phone_number | text | ✅ | - |
| revenuAnnuel | double precision | ✅ | **camelCase** |
| secteurActivite | text | ✅ | **camelCase** |
| nombreEmployes | integer | ✅ | **camelCase** |
| chiffreAffaires | numeric | ✅ | **camelCase** |
| **derniereConnexion** | timestamp with time zone | ✅ | **⚠️ camelCase** |
| statut | character varying | ✅ | 'actif' |
| auth_id | uuid | ✅ | - |
| created_at | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

**⚠️ ATTENTION** : Colonnes en camelCase (pas snake_case) !

---

### **3. Expert**
**Colonnes** : 36  
**Lignes** : 12

| Colonne | Type | Nullable | Défaut |
|---------|------|----------|--------|
| id | uuid | ❌ | generate_expert_id() |
| email | text | ❌ | - |
| name | text | ❌ | - |
| company_name | text | ❌ | - |
| specializations | ARRAY | ✅ | '{}' |
| rating | double precision | ❌ | 5 |
| compensation | double precision | ✅ | - |
| status | text | ❌ | 'active' |
| approval_status | text | ✅ | 'pending' |
| auth_id | uuid | ✅ | - |
| total_assignments | integer | ✅ | 0 |
| completed_assignments | integer | ✅ | 0 |
| total_earnings | double precision | ✅ | 0.0 |
| monthly_earnings | double precision | ✅ | 0.0 |

---

### **4. ProduitEligible**
**Colonnes** : 15  
**Lignes** : 10

| Colonne | Type | Nullable | Défaut |
|---------|------|----------|--------|
| id | uuid | ❌ | gen_random_uuid() |
| nom | text | ✅ | - |
| description | text | ✅ | - |
| categorie | text | ✅ | - |
| **montant_min** | double precision | ✅ | - |
| **montant_max** | double precision | ✅ | - |
| **taux_min** | double precision | ✅ | - |
| **taux_max** | double precision | ✅ | - |
| **duree_min** | integer | ✅ | - |
| **duree_max** | integer | ✅ | - |
| dureeMax | integer | ✅ | - |
| category | character varying | ✅ | 'general' |
| active | boolean | ✅ | true |
| created_at | timestamp without time zone | ✅ | now() |
| updated_at | timestamp without time zone | ✅ | now() |

**⚠️ ATTENTION** : PAS de colonnes `montant` ou `taux` simples !

---

### **5. ClientProduitEligible**
**Colonnes** : 20  
**Lignes** : 2

| Colonne | Type | Nullable | Défaut |
|---------|------|----------|--------|
| id | uuid | ❌ | uuid_generate_v4() |
| **clientId** | uuid | ❌ | - |
| **produitId** | uuid | ❌ | - |
| statut | text | ❌ | 'opportunité' |
| **tauxFinal** | double precision | ✅ | - |
| **montantFinal** | double precision | ✅ | - |
| **dureeFinale** | integer | ✅ | - |
| expert_id | uuid | ✅ | - |
| simulationId | uuid | ✅ | - |
| metadata | jsonb | ✅ | '{}' |
| current_step | integer | ✅ | 0 |
| progress | integer | ✅ | 0 |
| charte_signed | boolean | ✅ | false |
| created_at | timestamp with time zone | ❌ | (now() AT TIME ZONE 'utc') |
| updated_at | timestamp with time zone | ❌ | (now() AT TIME ZONE 'utc') |

**⚠️ ATTENTION** : camelCase pour clientId, produitId, montantFinal, etc.

---

### **6. ApporteurAffaires** ✅
**Colonnes** : 16  
**Lignes** : 0

| Colonne | Type | Nullable | Défaut |
|---------|------|----------|--------|
| id | uuid | ❌ | gen_random_uuid() |
| auth_id | uuid | ✅ | - |
| first_name | character varying | ❌ | - |
| last_name | character varying | ❌ | - |
| email | character varying | ❌ | - |
| phone | character varying | ✅ | - |
| company_name | character varying | ✅ | - |
| company_type | character varying | ✅ | - |
| siren | character varying | ✅ | - |
| commission_rate | numeric | ✅ | 0.00 |
| status | character varying | ✅ | 'pending_approval' |
| approved_by | uuid | ✅ | - |
| created_at | timestamp with time zone | ✅ | now() |

**✅ Structure correcte et complète**

---

### **7. Prospect** ✅
**Colonnes** : 26  
**Lignes** : 0

Table complète pour les prospects chauds des apporteurs.

---

## 🔍 **TABLES DÉJÀ EXISTANTES (Bonnes Surprises)**

### **user_sessions** ✅ EXISTE DÉJÀ !
**Colonnes** : 8  
**Lignes** : 0

| Colonne | Type | Nullable |
|---------|------|----------|
| id | uuid | ❌ |
| user_id | uuid | ❌ |
| user_type | character varying | ❌ |
| session_token | character varying | ❌ |
| last_activity | timestamp with time zone | ✅ |
| created_at | timestamp with time zone | ✅ |
| expires_at | timestamp with time zone | ❌ |
| metadata | jsonb | ✅ |

**⚠️ DIFFÉRENCE** : Structure plus simple que notre script. Pas besoin de recréer !

---

### **system_metrics** ✅ EXISTE DÉJÀ !
**Colonnes** : 11  
**Lignes** : 46,214

Table déjà remplie avec des métriques système !

---

## 📋 **VUES DÉJÀ CRÉÉES**

| Vue | Description | Utilité |
|-----|-------------|---------|
| **expert_stats_view** | Stats par expert | ✅ Dashboard |
| **authenticated_users** | Users auth unifiés | ✅ Auth |
| **admin_action_stats** | Stats actions admin | ✅ Audit |
| **v_expert_assignments** | Assignations expert | ✅ Dashboard |
| **v_today_events** | Événements aujourd'hui | ✅ Calendrier |
| **notification_stats** | Stats notifications | ✅ Dashboard |

---

## ⚠️ **PROBLÈMES IDENTIFIÉS**

### **1. Erreur dans analyze-complete-database.sql**
```sql
-- ERREUR : Casse incorrecte
SELECT * FROM "Admin" -- ✅ CORRECT
SELECT * FROM "admin" -- ❌ ERREUR
```

### **2. Nom de colonne camelCase**
```sql
-- ERREUR dans create-dashboard-views.sql ligne 19
WHERE derniereConnexion >= ... -- ❌ Sans guillemets = erreur

-- CORRECT
WHERE "derniereConnexion" >= ... -- ✅ Avec guillemets
```

---

## 🎯 **COLONNES CRITIQUES POUR LE DASHBOARD**

### **Pour les tuiles KPIs** :

| Table | Colonne exacte | Type | Notes |
|-------|----------------|------|-------|
| Client | statut | character varying | Valeurs : 'actif', 'inactif', 'suspendu', 'supprime' |
| Client | "derniereConnexion" | timestamp with time zone | ⚠️ camelCase avec guillemets |
| Expert | status | text | Valeurs : 'active', 'inactive' |
| Expert | approval_status | text | Valeurs : 'pending', 'approved', 'rejected' |
| ClientProduitEligible | statut | text | Valeurs : 'eligible', 'ineligible', 'en_cours', 'termine', 'annule' |
| ClientProduitEligible | "montantFinal" | double precision | ⚠️ camelCase avec guillemets |
| ClientProduitEligible | "clientId" | uuid | ⚠️ camelCase avec guillemets |
| ClientProduitEligible | "produitId" | uuid | ⚠️ camelCase avec guillemets |

---

## 📈 **DONNÉES RÉELLES DISPONIBLES**

| Table | Lignes | Utilisable pour Dashboard |
|-------|--------|---------------------------|
| system_metrics | 46,214 | ✅ Performance système |
| audit_logs | 1,907 | ✅ Activité admin |
| documentation_items | 52 | ✅ Documentation |
| conversations | 25 | ✅ Messagerie |
| simulations | 16 | ✅ Simulateur |
| Client | 13 | ✅ KPIs Clients |
| Expert | 12 | ✅ KPIs Experts |
| ProduitEligible | 10 | ✅ Catalogue |
| ClientProduitEligible | 2 | ✅ Dossiers |

**Note** : Données suffisantes pour afficher de vrais KPIs !

---

## 🚨 **PROBLÈMES DASHBOARD ACTUELS - SOLUTIONS**

### **Erreur 1 : column "derniereconnexion" does not exist**
**Cause** : Casse incorrecte  
**Solution** : Utiliser `"derniereConnexion"` avec guillemets

### **Erreur 2 : relation "public.admin" does not exist**
**Cause** : Casse incorrecte  
**Solution** : Utiliser `"Admin"` avec A majuscule

### **Erreur 3 : column ProduitEligible_1.montant does not exist**
**Cause** : Colonnes montant/taux n'existent pas  
**Solution** : ✅ Déjà corrigé dans admin.ts (montant_min, montant_max, etc.)

### **Erreur 4 : 404 /api/admin/apporteurs**
**Cause** : Railway pas redéployé avec le nouveau code  
**Solution** : Redéployer Railway

---

## 💡 **DÉCOUVERTES IMPORTANTES**

### **✅ Tables déjà créées (pas besoin de les recréer)** :
1. `user_sessions` - Tracking utilisateurs
2. `system_metrics` - Métriques système (46k lignes !)
3. `audit_logs` - Logs d'audit
4. `admin_messages` - Messages admin
5. Toutes les tables Apporteur (ApporteurAffaires, Prospect, etc.)

### **✅ Vues déjà créées (utilisables)** :
1. `expert_stats_view` - Stats experts
2. `v_expert_assignments` - Assignations
3. `notification_stats` - Stats notifications
4. `authenticated_users` - Users auth

---

## 🔧 **RELATIONS FK IMPORTANTES**

```
Client (33 colonnes)
  ↓ clientId (FK)
ClientProduitEligible (20 colonnes)
  ↓ produitId (FK)        ↓ expert_id (FK)
ProduitEligible (15)     Expert (36)
```

```
ApporteurAffaires (16 colonnes)
  ↓ apporteur_id (FK)
Prospect (26 colonnes)
  ↓ preselected_expert_id (FK)
Expert (36)
```

---

## 📝 **GUIDE D'UTILISATION DES COLONNES**

### **Client - Colonnes camelCase** :
```sql
-- ❌ ERREUR
SELECT derniere_connexion FROM "Client"
SELECT derniere_connexion FROM Client

-- ✅ CORRECT
SELECT "derniereConnexion" FROM "Client"
SELECT "secteurActivite" FROM "Client"
SELECT "nombreEmployes" FROM "Client"
SELECT "chiffreAffaires" FROM "Client"
SELECT "dateCreation" FROM "Client"
```

### **ClientProduitEligible - Colonnes camelCase** :
```sql
-- ✅ CORRECT
SELECT "clientId", "produitId", "montantFinal", "tauxFinal", "dureeFinale"
FROM "ClientProduitEligible"
```

### **ProduitEligible - Colonnes snake_case** :
```sql
-- ✅ CORRECT
SELECT montant_min, montant_max, taux_min, taux_max, duree_min, duree_max
FROM "ProduitEligible"
```

---

## 🎯 **RECOMMANDATIONS POUR LES REQUÊTES**

### **1. Toujours utiliser les guillemets pour les tables** :
```sql
FROM "Client"  -- ✅ CORRECT
FROM Client    -- ⚠️ Peut causer des problèmes
```

### **2. Guillemets pour colonnes camelCase** :
```sql
WHERE "derniereConnexion" >= NOW()  -- ✅ CORRECT
WHERE derniereConnexion >= NOW()    -- ❌ ERREUR
```

### **3. Préférer les colonnes snake_case sans guillemets** :
```sql
WHERE created_at >= NOW()  -- ✅ CORRECT (snake_case)
WHERE statut = 'actif'     -- ✅ CORRECT (snake_case)
```

---

## 📊 **STRUCTURE RECOMMANDÉE POUR NOUVELLES VUES**

```sql
-- Vue Dashboard KPIs (corrigée)
CREATE OR REPLACE VIEW vue_dashboard_kpis_v2 AS
SELECT 
  -- Clients (avec guillemets sur camelCase)
  (SELECT COUNT(*) FROM "Client") as total_clients,
  (SELECT COUNT(*) FROM "Client" WHERE statut = 'actif') as clients_actifs,
  (SELECT COUNT(*) FROM "Client" 
   WHERE "derniereConnexion" >= NOW() - INTERVAL '24 hours') as clients_actifs_24h,
  
  -- Experts
  (SELECT COUNT(*) FROM "Expert" WHERE status = 'active') as experts_actifs,
  (SELECT COUNT(*) FROM "Expert" WHERE approval_status = 'pending') as experts_pending,
  
  -- Dossiers (avec guillemets sur camelCase)
  (SELECT COUNT(*) FROM "ClientProduitEligible") as total_dossiers,
  (SELECT SUM("montantFinal") FROM "ClientProduitEligible") as montant_total,
  
  -- Apporteurs
  (SELECT COUNT(*) FROM "ApporteurAffaires" WHERE status = 'active') as apporteurs_actifs;
```

---

## 🔐 **POLITIQUES RLS ACTIVES**

| Table | Politique | Pour qui |
|-------|-----------|----------|
| ApporteurAffaires | admin_full_access_apporteur | ✅ Admins |
| ApporteurAffaires | apporteur_own_data | Apporteurs |
| Prospect | admin_full_access_prospect | ✅ Admins |
| ExpertNotification | admin_full_access_expert_notification | ✅ Admins |
| Client | Multiple policies | Clients, Admins |
| Expert | Multiple policies | Experts, Admins |

---

## 📦 **FICHIER GÉNÉRÉ AUTOMATIQUEMENT**

Ce fichier a été généré automatiquement à partir de l'analyse complète de la base de données Supabase en production.

**Commandes utilisées** :
```sql
-- Structure des tables
SELECT * FROM information_schema.columns WHERE table_schema = 'public';

-- Index
SELECT * FROM pg_indexes WHERE schemaname = 'public';

-- Politiques RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Statistiques d'utilisation
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
```

---

**Version** : 1.0  
**Dernière mise à jour** : 1er octobre 2025

