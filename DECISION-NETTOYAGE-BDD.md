# 🧹 Décision : Nettoyage Base de Données

Date : 22 octobre 2025

## ⚠️ CONCLUSION CRITIQUE

**CalendarEvent NE PEUT PAS être supprimée !**

---

## 📊 Analyse des dépendances

### CalendarEvent est utilisée par :

#### 🔧 Backend (6 fichiers, 28 occurrences)
1. `server/src/routes/calendar.ts` - Routes principales calendrier
2. `server/src/routes/collaborative-events.ts` - Événements collaboratifs
3. `server/src/routes/google-calendar.ts` - Synchronisation Google
4. `server/src/services/calendar-reminder-service.ts` - Rappels automatiques
5. `server/src/services/collaborative-events-service.ts` - Service collaboratif
6. `server/src/services/intelligent-sync-service.ts` - Sync intelligent

#### 🔗 Dépendances base de données (5 tables)
1. **CalendarEventParticipant** - Participants des événements
2. **CalendarEventReminder** - Système de rappels
3. **EventInvitation** - Invitations
4. **GoogleCalendarEventMapping** - Mapping Google Calendar
5. Plus les FK vers Client, Expert, ClientProduitEligible

#### 🎯 Fonctionnalités impactées si suppression
- ❌ Calendrier collaboratif cassé
- ❌ Sync Google Calendar cassée
- ❌ Rappels automatiques cassés
- ❌ Invitations d'événements cassées
- ❌ Dashboards calendrier cassés

---

## ✅ ARCHITECTURE FINALE : Coexistence

Les deux systèmes servent des besoins **différents** et **complémentaires** :

### 📅 CalendarEvent - Événements généraux
**Usage** :
- Deadlines
- Tasks  
- Événements collaboratifs
- Synchronisation Google Calendar
- Rappels système
- Événements récurrents

**Caractéristiques** :
- Plus générique
- Système de participants flexible
- Intégration Google Calendar
- Rappels automatiques

---

### 🤝 RDV - Rendez-vous métier
**Usage** :
- Rendez-vous Client ↔ Expert
- Rendez-vous Client ↔ Apporteur
- RDV de qualification
- RDV de validation

**Caractéristiques** :
- Workflow métier riche (expert_response, alternative_date, etc.)
- Liaison native avec produits (RDV_Produits)
- Gestion apporteur intégrée
- Statuts métier (scheduled, confirmed, completed, cancelled)

---

## 🎯 Stratégie d'utilisation

### Quand utiliser CalendarEvent ?
- ✅ Événements collaboratifs (plusieurs participants)
- ✅ Synchronisation avec Google Calendar
- ✅ Deadlines et tâches
- ✅ Rappels automatiques
- ✅ Événements récurrents

### Quand utiliser RDV ?
- ✅ Rendez-vous Client-Expert (1-à-1)
- ✅ Rendez-vous Client-Apporteur (1-à-1)
- ✅ RDV avec workflow de validation
- ✅ RDV lié à des produits spécifiques
- ✅ Suivi métier (outcome, next_steps, follow_up)

---

## 🗑️ Tables à VRAIMENT supprimer

### Tables candidates à la suppression

Exécute `find-truly-obsolete-tables.sql` pour identifier :

1. **Tables avec suffixes** : `_old`, `_backup`, `_temp`, `_test`
2. **Tables de migration** : `schema_migrations` (si présentes)
3. **Tables isolées** : Sans foreign keys ni indexes
4. **Tables vides** : 0 lignes et non utilisées dans le code

### ⚠️ À VÉRIFIER manuellement

Si tu vois ces tables, on doit vérifier avant suppression :
- `ClientRDV` (ancienne version ?)
- `ClientRDV_Produits` (ancienne version ?)
- Tables avec préfixes `tmp_`, `test_`, `demo_`

---

## 📋 Script de nettoyage sécurisé

**UNIQUEMENT** après avoir exécuté `find-truly-obsolete-tables.sql` et vérifié les résultats !

```sql
-- ============================================================================
-- SCRIPT DE NETTOYAGE SÉCURISÉ
-- ============================================================================
-- ⚠️ NE PAS EXÉCUTER SANS VÉRIFICATION PRÉALABLE !

-- Exemple de structure (À ADAPTER selon tes résultats)
BEGIN;

-- 1. Sauvegarder les données avant suppression (si nécessaire)
-- CREATE TABLE backup_XXX AS SELECT * FROM XXX;

-- 2. Supprimer les tables vraiment obsolètes (EXEMPLES SEULEMENT)
-- DROP TABLE IF EXISTS "Table_old" CASCADE;
-- DROP TABLE IF EXISTS "Table_backup" CASCADE;
-- DROP TABLE IF EXISTS "Table_temp" CASCADE;

-- 3. Vérifier qu'aucune erreur
SELECT 'Nettoyage terminé' as statut;

-- 4. Si tout OK, commit. Sinon ROLLBACK !
-- COMMIT;
ROLLBACK; -- Par sécurité, rollback par défaut
```

---

## 🚀 Action immédiate

**ÉTAPE 1** : Exécute `find-truly-obsolete-tables.sql` dans Supabase

**ÉTAPE 2** : Envoie-moi les résultats (les 4 premières sections)

**ÉTAPE 3** : Je créerai un script de nettoyage **personnalisé** et **sécurisé**

---

## ✅ Ce qui est DÉJÀ fait

1. ✅ Table `RDV` en production avec contrainte expert_id NULL
2. ✅ RDVService créé et opérationnel
3. ✅ Création de RDV via apporteur-simulation.ts corrigée
4. ✅ Création de RDV via ProspectService.ts corrigée
5. ✅ Les deux systèmes (CalendarEvent + RDV) coexistent correctement

---

## 📊 Métriques actuelles

| Table | Lignes | Statut | Action |
|-------|--------|--------|--------|
| RDV | 0 | Production ✅ | **GARDER** |
| RDV_Produits | 0 | Production ✅ | **GARDER** |
| CalendarEvent | 6 | Production ✅ | **GARDER** |
| CalendarEventParticipant | ? | Production ✅ | **GARDER** |
| CalendarEventReminder | ? | Production ✅ | **GARDER** |
| EventInvitation | ? | Production ✅ | **GARDER** |
| GoogleCalendarEventMapping | ? | Production ✅ | **GARDER** |

---

## 🎯 Prochaines étapes

### Pour le Wizard Formulaire Prospects

Maintenant qu'on a clarifié le système RDV, on peut :

1. ✅ Utiliser `RDVService.createMultipleRDV()` pour l'étape 4
2. ✅ Créer des RDV multiples (Prospect + Expert A, Prospect + Expert B, Prospect + Apporteur)
3. ✅ Champs conditionnels selon meeting_type (adresse/URL/téléphone)
4. ✅ Validation des participants

### Pour le nettoyage BDD

1. Exécuter `find-truly-obsolete-tables.sql`
2. Identifier les vraies tables obsolètes
3. Créer un script de suppression sécurisé
4. Sauvegarder avant suppression
5. Tester après suppression

---

## 💡 Recommandation finale

**NE PAS supprimer CalendarEvent !**

Les deux systèmes ont des rôles différents et complémentaires :
- `CalendarEvent` = Calendrier général, sync Google, collaboratif
- `RDV` = Rendez-vous métier Client-Expert-Apporteur

Cette architecture est **saine et logique**. 

Concentre-toi uniquement sur la suppression des tables avec suffixes `_old`, `_backup`, `_temp`, `_test` (s'il y en a).

