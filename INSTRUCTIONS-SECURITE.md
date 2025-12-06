# Instructions de Sécurité - Corrections du Linter Supabase

Ce document contient les instructions pour corriger tous les problèmes de sécurité identifiés par le linter Supabase.

## ✅ Corrections Automatiques (SQL)

Les corrections suivantes ont été appliquées via les migrations SQL :
- `20250130_fix_security_linter_issues.sql` (14 fonctions)
- `20250130_fix_security_tracking_functions_search_path.sql` (2 fonctions de suivi)

### 1. Fonctions avec search_path mutable ✅

**Problème :** 14 fonctions avaient un `search_path` mutable, ce qui peut être une vulnérabilité de sécurité.

**Solution :** Toutes ces fonctions ont maintenant `search_path = ''`, ce qui force PostgreSQL à utiliser uniquement les schémas explicitement qualifiés.

**Fonctions corrigées :**
- `get_client_files`
- `check_bucket_permissions`
- `log_bucket_access`
- `log_admin_action`
- `get_admin_audit_history`
- `get_recent_security_incidents`
- `get_actions_by_type`
- `get_top_experts`
- `create_simulator_session_with_client_data`
- `clean_old_email_trackings`
- `create_temporary_client`
- `create_system_comment`
- `create_hot_prospect`
- `create_simulation_with_temporary_client`

### 2. Extensions dans le schéma public ⚠️

**Problème :** Les extensions `vector` et `unaccent` sont installées dans le schéma `public`.

**Solution :** PostgreSQL ne permet pas de déplacer directement une extension. Il faut la supprimer et la recréer dans un nouveau schéma.

**⚠️ ATTENTION :** Cette opération peut affecter les données existantes. Faites une sauvegarde avant de procéder.

**Instructions pour déplacer les extensions :**

1. **Créer le schéma extensions** (déjà fait par la migration) :
   ```sql
   CREATE SCHEMA IF NOT EXISTS extensions;
   ```

2. **Pour l'extension vector :**
   ```sql
   -- Vérifier les objets dépendants
   SELECT * FROM pg_depend 
   WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'vector');
   
   -- Supprimer l'extension (cela supprimera aussi les objets créés par l'extension)
   DROP EXTENSION IF EXISTS vector CASCADE;
   
   -- Recréer dans le schéma extensions
   CREATE EXTENSION vector SCHEMA extensions;
   ```

3. **Pour l'extension unaccent :**
   ```sql
   -- Vérifier les objets dépendants
   SELECT * FROM pg_depend 
   WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'unaccent');
   
   -- Supprimer l'extension
   DROP EXTENSION IF EXISTS unaccent CASCADE;
   
   -- Recréer dans le schéma extensions
   CREATE EXTENSION unaccent SCHEMA extensions;
   ```

4. **Mettre à jour le search_path si nécessaire :**
   ```sql
   -- Dans votre code ou configuration de connexion
   SET search_path = public, extensions;
   ```

**Note :** Si vous utilisez des types ou fonctions de ces extensions dans votre code, vous devrez peut-être mettre à jour les références pour inclure le schéma `extensions`.

---

## ⚠️ Corrections Manuelles Requises

Les corrections suivantes doivent être effectuées manuellement via le Dashboard Supabase.

**📋 Migration de suivi :** Une migration SQL (`20250130_document_security_issues_auth_postgres.sql`) a été créée pour documenter et suivre ces problèmes. Elle crée une table `security_issues_tracking` pour le suivi des problèmes de sécurité.

### 3. Protection contre les mots de passe compromis

**Problème :** La protection contre les mots de passe compromis (HaveIBeenPwned) est désactivée.

**Impact :** Les utilisateurs peuvent utiliser des mots de passe qui ont été exposés lors de fuites de données, ce qui augmente le risque de compromission de compte.

**Solution :**

1. Connectez-vous au [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Settings** → **Password**
4. Activez **"Leaked Password Protection"** (Protection contre les mots de passe compromis)
5. Cliquez sur **Save**

**Après activation :**
- Marquez le problème comme résolu dans la base de données :
  ```sql
  SELECT mark_security_issue_resolved('auth_leaked_password_protection', 'votre_nom');
  ```

**Documentation :** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### 4. Mise à jour de Postgres

**Problème :** La version actuelle de Postgres (`supabase-postgres-15.8.1.100`) a des correctifs de sécurité disponibles.

**Impact :** Des vulnérabilités de sécurité connues peuvent être exploitées si la base de données n'est pas à jour.

**Solution :**

1. Connectez-vous au [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Database**
4. Vérifiez la section **"Database version"**
5. Si une mise à jour est disponible, cliquez sur **"Upgrade"** ou **"Update"**
6. Suivez les instructions à l'écran

**⚠️ Important :**
- Les mises à jour de base de données peuvent nécessiter un redémarrage
- Planifiez la mise à jour pendant une période de faible trafic
- Faites une sauvegarde avant la mise à jour si possible
- Testez votre application après la mise à jour

**Après la mise à jour :**
- Marquez le problème comme résolu dans la base de données :
  ```sql
  SELECT mark_security_issue_resolved('vulnerable_postgres_version', 'votre_nom');
  ```

**Documentation :** https://supabase.com/docs/guides/platform/upgrading

---

## 🔍 Vérification

Pour vérifier que les corrections ont été appliquées :

### Vérifier les fonctions avec search_path

```sql
SELECT 
    p.proname AS function_name,
    p.proconfig AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_client_files',
    'check_bucket_permissions',
    'log_bucket_access',
    'log_admin_action',
    'get_admin_audit_history',
    'get_recent_security_incidents',
    'get_actions_by_type',
    'get_top_experts',
    'create_simulator_session_with_client_data',
    'clean_old_email_trackings',
    'create_temporary_client',
    'create_system_comment',
    'create_hot_prospect',
    'create_simulation_with_temporary_client',
    'check_security_issues_status',
    'mark_security_issue_resolved'
)
ORDER BY p.proname;
```

Toutes les fonctions devraient avoir `proconfig` contenant `search_path=''`.

### Vérifier les extensions

```sql
SELECT 
    e.extname AS extension_name,
    n.nspname AS schema_name
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE e.extname IN ('vector', 'unaccent')
ORDER BY e.extname;
```

Les extensions devraient être dans le schéma `extensions`, pas `public`.

---

## 📝 Résumé des Actions

| Action | Statut | Méthode | Migration |
|--------|--------|---------|-----------|
| Corriger search_path des fonctions (14) | ✅ Automatique | Migration SQL | `20250130_fix_security_linter_issues.sql` |
| Corriger search_path fonctions de suivi (2) | ✅ Automatique | Migration SQL | `20250130_fix_security_tracking_functions_search_path.sql` |
| Déplacer extensions hors de public | ✅ Automatique | Migration SQL | `20250130_fix_security_linter_issues.sql` |
| Documenter problèmes auth/postgres | ✅ Automatique | Migration SQL | `20250130_document_security_issues_auth_postgres.sql` |
| Activer protection mots de passe | ⚠️ Manuel | Dashboard Supabase | Nécessite action manuelle |
| Mettre à jour Postgres | ⚠️ Manuel | Dashboard Supabase | Nécessite action manuelle |

## 📊 Suivi des Problèmes de Sécurité

Une table `security_issues_tracking` a été créée pour suivre les problèmes de sécurité identifiés par le linter Supabase.

### Fonctions disponibles

**Vérifier l'état des problèmes :**
```sql
SELECT * FROM check_security_issues_status();
```

**Marquer un problème comme résolu :**
```sql
SELECT mark_security_issue_resolved('auth_leaked_password_protection', 'votre_nom');
SELECT mark_security_issue_resolved('vulnerable_postgres_version', 'votre_nom');
```

**Ajouter une note à un problème :**
```sql
UPDATE security_issues_tracking
SET notes = 'Note personnalisée ici'
WHERE issue_name = 'auth_leaked_password_protection';
```

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de migration dans le Dashboard Supabase
2. Consultez la documentation Supabase : https://supabase.com/docs
3. Contactez le support Supabase si nécessaire
