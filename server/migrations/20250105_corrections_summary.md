# Résumé des Corrections de Noms de Colonnes

## Problème identifié
Les erreurs `ERROR: 42P01: relation "transactions" does not exist` et `ERROR: 42703: column "clientid" does not exist` sont causées par des incohérences entre les noms de colonnes utilisés dans le code et ceux qui existent réellement dans la base de données.

## Tables et colonnes corrigées

### ✅ Tables déjà corrigées :
1. **`simulations`** : `client_id` (snake_case) ✅
2. **`Audit`** : `clientId` (camelCase) ✅

### 🔧 Tables à vérifier dans le code :

#### Tables avec `clientId` (camelCase) :
- `Appointment` - utiliser `clientId`
- `ClientProduitEligible` - utiliser `clientId` 
- `Dossier` - utiliser `clientId`

#### Tables avec `client_id` (snake_case) :
- `CalendarEvent` - utiliser `client_id` ✅
- `Reminder` - utiliser `client_id`
- `ValidationState` - utiliser `client_id`
- `WorkflowInstance` - utiliser `client_id`
- `conversations` - utiliser `client_id`
- `expertassignment` - utiliser `client_id`
- `invoice` - utiliser `client_id`
- `simulations` - utiliser `client_id` ✅

#### Tables avec `clientid` (tout en minuscules) :
- `SimulationProcessed` - utiliser `clientid`

## Fichiers à corriger

### Routes déjà corrigées :
- ✅ `server/src/routes/simulation.ts`
- ✅ `server/src/routes/simulations.ts`
- ✅ `server/src/routes/client-documents.ts`

### Services à vérifier :
- `server/src/services/reminderService.ts`
- `server/src/services/DatabaseOptimizer.ts`
- `server/src/services/eligibilityEngine.ts`
- `server/src/services/dossierStepGenerator.ts`

## Prochaines étapes

1. **Exécuter le script de vérification** : `20250105_verify_client_columns.sql`
2. **Identifier les fichiers problématiques** avec grep
3. **Corriger les noms de colonnes** dans chaque fichier
4. **Tester les API** après corrections

## Scripts SQL utiles

### Vérification :
```sql
-- Vérifier les colonnes client dans toutes les tables
\i server/migrations/20250105_verify_client_columns.sql
```

### Correction des noms de colonnes :
```sql
-- Vérifier les colonnes actuelles
\i server/migrations/20250105_fix_column_names.sql
``` 