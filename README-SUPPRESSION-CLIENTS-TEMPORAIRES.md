# 📋 Guide de Suppression des Clients Temporaires

Ce guide explique comment supprimer en toute sécurité tous les clients temporaires ayant un email temporaire.

## 🎯 Objectif

Supprimer tous les clients temporaires identifiés par :
- Email contenant `@profitum.temp`
- Email commençant par `temp_`
- Email contenant `@temp`
- Type = `temporaire`

## ⚠️ IMPORTANT - AVANT DE COMMENCER

1. **FAITES UNE SAUVEGARDE** de la base de données avant toute suppression
2. **EXÉCUTEZ D'ABORD** le script de vérification pour voir ce qui sera supprimé
3. **VÉRIFIEZ** que vous avez bien identifié les clients temporaires
4. **TESTEZ** sur un environnement de développement/staging si possible

## 📁 Fichiers Disponibles

### 1. `verifier-clients-temporaires.sql` ⭐ COMMENCER ICI
**Objectif** : Vérifier les clients temporaires et leurs dépendances **SANS SUPPRIMER**

**Usage** :
```bash
psql -d votre_base_de_donnees -f verifier-clients-temporaires.sql
```

**Ce script affiche** :
- ✅ Liste de tous les clients temporaires identifiés
- ✅ Nombre total de clients temporaires
- ✅ Récapitulatif des dépendances par table
- ✅ Détail des dépendances par client
- ✅ Clients avec le plus de dépendances (attention)
- ✅ Résumé exécutif avec nombre total de lignes à supprimer

### 2. `detecter-tables-avec-fk-client.sql`
**Objectif** : Détecter automatiquement toutes les tables ayant une FK vers Client

**Usage** :
```bash
psql -d votre_base_de_donnees -f detecter-tables-avec-fk-client.sql
```

**Ce script affiche** :
- ✅ Toutes les tables avec FK vers Client
- ✅ Les règles de suppression (CASCADE, SET NULL, RESTRICT)
- ✅ Les colonnes potentielles référençant Client
- ✅ Les requêtes SQL générées automatiquement

### 3. `script-suppression-clients-temporaires.sql` 🗑️
**Objectif** : Supprimer effectivement les clients temporaires et leurs dépendances

**Usage** :
```bash
# IMPORTANT: Exécuter dans une transaction
psql -d votre_base_de_donnees -f script-suppression-clients-temporaires.sql
```

**Ce script** :
- ✅ Identifie les clients temporaires
- ✅ Vérifie toutes les dépendances
- ✅ Supprime dans le bon ordre (en respectant les FK)
- ✅ Affiche les résultats de suppression

## 🔄 Processus Recommandé

### Étape 1 : Vérification Initiale
```bash
psql -d votre_base -f verifier-clients-temporaires.sql > verification-result.txt
```

Examinez le fichier `verification-result.txt` pour :
- Confirmer que ce sont bien des clients temporaires
- Vérifier le nombre de dépendances
- Identifier les clients avec beaucoup de données liées

### Étape 2 : Détection Automatique (Optionnel)
```bash
psql -d votre_base -f detecter-tables-avec-fk-client.sql > detection-result.txt
```

Vérifiez que toutes les tables importantes sont détectées.

### Étape 3 : Sauvegarde
```bash
# Créer une sauvegarde complète
pg_dump -d votre_base > backup_avant_suppression_$(date +%Y%m%d_%H%M%S).sql
```

### Étape 4 : Suppression
```bash
# Exécuter le script de suppression
psql -d votre_base -f script-suppression-clients-temporaires.sql
```

## 📊 Ordre de Suppression

Le script supprime dans cet ordre (pour respecter les contraintes FK) :

1. **Documents** (`ClientProcessDocument`)
2. **Demandes de documents** (`document_request`)
3. **Dossiers** (`ClientProduitEligible`) - les plus importants
4. **Chartes** (`Charter`)
5. **Signatures de charte** (`client_charte_signature`)
6. **Audits** (`Audit`)
7. **Simulations** (`simulations`, `Simulation`)
8. **Événements calendrier** (`CalendarEvent`)
9. **Conversations** (`conversations`)
10. **Messages** (`message`)
11. **Notifications** (`notification`)
12. **Assignations expert** (`expertassignment`)
13. **Clients temporaires** (`Client`) - ENFIN

## ⚙️ Tables Prises en Compte

Le script vérifie et supprime les données liées dans ces tables :

| Table | Colonne FK | Impact |
|-------|-----------|--------|
| `ClientProduitEligible` | `clientId` | ⚠️ Dossiers clients |
| `ClientProcessDocument` | `client_id` | ⚠️ Documents uploadés |
| `Charter` | `clientId` | ⚠️ Chartes signées |
| `Audit` | `clientId`, `client_id` | ⚠️ Audits |
| `simulations` | `client_id` | ⚠️ Simulations |
| `Simulation` | `clientId` | ⚠️ Simulations (ancienne table) |
| `client_charte_signature` | `client_id` | ⚠️ Signatures |
| `conversations` | `client_id` | ⚠️ Conversations |
| `document_request` | `client_id` | ⚠️ Demandes documents |
| `CalendarEvent` | `client_id` | ⚠️ Rendez-vous |
| `message` | `client_id` | ⚠️ Messages |
| `notification` | `client_id`, `user_id` | ⚠️ Notifications |
| `expertassignment` | `client_id` | ⚠️ Assignations |

## 🔐 Comptes Supabase Auth

**IMPORTANT** : Les comptes Supabase Auth doivent être supprimés séparément :

1. Via le Dashboard Supabase :
   - Authentication → Users
   - Rechercher les emails temporaires
   - Supprimer manuellement

2. Via l'API Supabase Admin :
   ```javascript
   await supabase.auth.admin.deleteUser(auth_user_id)
   ```

Le script SQL ne supprime **QUE** les données de la base PostgreSQL, pas les comptes Auth.

## ✅ Vérification Post-Suppression

Après l'exécution, vérifiez :

```sql
-- Vérifier qu'il ne reste plus de clients temporaires
SELECT COUNT(*) 
FROM "Client"
WHERE email LIKE '%@profitum.temp%'
   OR email LIKE 'temp_%@%'
   OR type = 'temporaire';

-- Devrait retourner 0
```

## 🆘 En Cas de Problème

### Rollback

Si le script échoue ou si vous voulez annuler :

```sql
ROLLBACK;
```

### Restauration

```bash
psql -d votre_base < backup_avant_suppression_YYYYMMDD_HHMMSS.sql
```

## 📝 Notes Importantes

1. **Transaction** : Le script utilise `BEGIN` et `COMMIT` pour garantir que tout est supprimé ou rien
2. **Ordre de suppression** : Respecte strictement l'ordre des FK pour éviter les erreurs
3. **Dépendances** : Toutes les dépendances sont supprimées AVANT les clients
4. **Sécurité** : Le script vérifie avant de supprimer

## 🔍 Dépannage

### Erreur : "violates foreign key constraint"
- **Cause** : Une table n'a pas été supprimée dans le bon ordre
- **Solution** : Vérifiez que toutes les tables listées dans le script existent et sont correctement nommées

### Erreur : "relation does not exist"
- **Cause** : Le nom de la table ou le schéma est incorrect
- **Solution** : Vérifiez les noms de tables dans votre base de données avec `\dt` dans psql

### Aucun client supprimé
- **Cause** : Aucun client ne correspond aux critères
- **Vérification** : Exécutez `verifier-clients-temporaires.sql` pour voir ce qui est trouvé

## 📞 Support

En cas de question ou problème, consultez :
- Les logs PostgreSQL
- Les résultats des scripts de vérification
- La documentation de votre base de données

