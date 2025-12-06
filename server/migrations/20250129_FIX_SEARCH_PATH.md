# 🔒 Correction du Search Path pour les Fonctions PostgreSQL

## 📊 Résumé

**Date :** 2025-01-29  
**Problème :** 200+ fonctions avec `search_path` mutable détectées par le linter Supabase  
**Solution :** Migration SQL pour définir `search_path = ''` sur toutes les fonctions

## ⚠️ Problème de Sécurité

Le linter Supabase a détecté que de nombreuses fonctions PostgreSQL n'ont pas leur `search_path` défini explicitement. Cela peut créer une vulnérabilité de sécurité connue sous le nom de **"search_path hijacking"**.

### Pourquoi c'est dangereux ?

1. **Attaque par injection de schéma** : Un attaquant pourrait créer des objets (tables, fonctions) dans un schéma qui apparaît tôt dans le `search_path`
2. **Exécution de code malveillant** : Si une fonction utilise des objets non qualifiés, elle pourrait exécuter du code non prévu
3. **Contournement des permissions** : Les fonctions pourraient accéder à des objets dans des schémas non autorisés

## ✅ Solution Appliquée

Deux migrations sont disponibles :

1. **`20250129_fix_function_search_path.sql`** - Version directe (nécessite que toutes les fonctions existent)
2. **`20250129_fix_function_search_path_safe.sql`** - Version sécurisée (recommandée, vérifie l'existence avant modification)

**Recommandation :** Utilisez la version `_safe.sql` qui vérifie l'existence de chaque fonction avant de la modifier, évitant ainsi les erreurs si certaines fonctions n'existent pas ou ont des signatures différentes.

### Qu'est-ce que `search_path = ''` ?

- Force PostgreSQL à utiliser **uniquement** les schémas explicitement qualifiés
- Empêche l'utilisation automatique de schémas dans le `search_path`
- Rend le code plus prévisible et sécurisé

### Exemple

**Avant (vulnérable) :**
```sql
CREATE FUNCTION get_user_data() RETURNS TABLE(...) AS $$
BEGIN
    SELECT * FROM users;  -- Utilise le search_path par défaut
END;
$$ LANGUAGE plpgsql;
```

**Après (sécurisé) :**
```sql
ALTER FUNCTION get_user_data() SET search_path = '';
-- La fonction doit maintenant utiliser public.users explicitement
```

## 📋 Fonctions Corrigées

La migration corrige **200+ fonctions** réparties dans les catégories suivantes :

### 🔄 Fonctions de mise à jour de timestamps (40+)
- `update_document_file_permission_updated_at`
- `update_calendar_updated_at`
- `update_import_mapping_config_updated_at`
- ... et bien d'autres

### 📁 Fonctions de gestion de fichiers et documents (20+)
- `get_client_files`
- `get_documents_stats`
- `cleanup_expired_files`
- ... et bien d'autres

### 🧹 Fonctions de nettoyage et maintenance (15+)
- `cleanup_expired_shares`
- `cleanup_old_notifications`
- `cleanup_old_access_logs`
- ... et bien d'autres

### 🔔 Fonctions de notifications (30+)
- `mark_notification_as_read`
- `create_notification_status_for_all_admins`
- `archive_notification`
- ... et bien d'autres

### 📅 Fonctions de calendrier et événements (5+)
- `create_recurring_events`
- `get_rdv_stats`
- `get_overdue_controls`
- ... et bien d'autres

### 💬 Fonctions de messagerie (6+)
- `create_admin_conversation`
- `update_conversation_last_message`
- `generate_message_thread_id`
- ... et bien d'autres

### 📊 Fonctions de calcul et statistiques (20+)
- `calculer_montant_produit`
- `get_expert_global_stats`
- `calculate_eligibility`
- ... et bien d'autres

### 👥 Fonctions de gestion de clients et experts (15+)
- `create_client`
- `generate_client_id`
- `get_user_details`
- ... et bien d'autres

### 🎯 Fonctions de gestion de prospects (6+)
- `save_prospect_report_version`
- `notify_prospect_reply`
- `convert_prospect_to_client`
- ... et bien d'autres

### 🖥️ Fonctions de simulateur (15+)
- `create_simulator_session_with_client_data`
- `save_simulator_responses`
- `migrate_simulator_to_client`
- ... et bien d'autres

### 📂 Fonctions de gestion de dossiers (6+)
- `trigger_update_dossier_progress`
- `log_dossier_change`
- `update_dossier_progress_from_steps`
- ... et bien d'autres

### 🔐 Fonctions de sécurité et audit (5+)
- `check_bucket_permissions`
- `log_admin_action`
- `detect_suspicious_activity`
- ... et bien d'autres

### 📧 Fonctions de gestion d'emails (4+)
- `generate_email_content_hash`
- `is_email_already_sent`
- `extract_email_domain`
- ... et bien d'autres

### 🏢 Fonctions de gestion de cabinet (4+)
- `cabinet_set_updated_at`
- `cabinet_set_slug`
- `refresh_cabinet_team_stat`
- ... et bien d'autres

### Et bien d'autres catégories...

## 🚀 Déploiement

### Étape 1 : Choisir la bonne migration

**Option A : Version sécurisée (recommandée)**
```bash
# Via Supabase Dashboard → SQL Editor
# Exécutez : server/migrations/20250129_fix_function_search_path_safe.sql
```

**Option B : Version directe**
```bash
# Via Supabase Dashboard → SQL Editor
# Ou via psql
psql $DATABASE_URL -f server/migrations/20250129_fix_function_search_path.sql
```

**Note :** La version `_safe.sql` vérifie l'existence de chaque fonction avant de la modifier et affiche des messages informatifs pour chaque fonction traitée. C'est la version recommandée si vous n'êtes pas sûr que toutes les fonctions existent.

### Étape 2 : Vérifier le déploiement

```sql
-- Vérifier qu'une fonction a bien search_path défini
SELECT 
    p.proname as function_name,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proconfig IS NOT NULL
AND array_to_string(p.proconfig, ',') LIKE '%search_path%'
ORDER BY p.proname
LIMIT 10;
```

### Étape 3 : Vérifier avec le linter Supabase

1. Aller dans Supabase Dashboard → Database → Linter
2. Vérifier que les avertissements `function_search_path_mutable` ont disparu
3. Si certains persistent, vérifier qu'ils ne sont pas dans le cache

## ⚠️ Notes Importantes

### Compatibilité

- ✅ Compatible avec PostgreSQL 12+
- ✅ Compatible avec Supabase
- ✅ N'affecte pas le comportement des fonctions existantes (si elles utilisent déjà des schémas qualifiés)

### Vérification Post-Migration

Si certaines fonctions utilisent des objets non qualifiés, elles pourraient échouer après cette migration. Dans ce cas :

1. Identifier la fonction qui échoue
2. Vérifier les objets utilisés dans son code
3. Qualifier explicitement les schémas (ex: `public.users` au lieu de `users`)

### Exemple de correction manuelle

Si une fonction échoue après la migration :

```sql
-- Avant (peut échouer avec search_path = '')
CREATE FUNCTION get_data() RETURNS TABLE(id INT) AS $$
BEGIN
    RETURN QUERY SELECT id FROM users;  -- ❌ Non qualifié
END;
$$ LANGUAGE plpgsql;

-- Après (fonctionne avec search_path = '')
CREATE FUNCTION get_data() RETURNS TABLE(id INT) AS $$
BEGIN
    RETURN QUERY SELECT id FROM public.users;  -- ✅ Qualifié
END;
$$ LANGUAGE plpgsql;
```

## 📝 Autres Problèmes Détectés par le Linter

Cette migration corrige uniquement le problème `function_search_path_mutable`. D'autres problèmes ont été détectés :

1. **Extension in Public** (2 extensions)
   - `vector` dans le schéma public
   - `unaccent` dans le schéma public
   - **Action requise** : Déplacer ces extensions vers un schéma dédié

2. **Leaked Password Protection Disabled**
   - Protection des mots de passe compromis désactivée
   - **Action requise** : Activer dans Supabase Dashboard → Auth → Settings

3. **Vulnerable Postgres Version**
   - Version PostgreSQL avec des correctifs de sécurité disponibles
   - **Action requise** : Mettre à jour PostgreSQL via Supabase Dashboard

## ✅ Checklist Post-Migration

- [ ] Migration exécutée avec succès
- [ ] Aucune erreur dans les logs
- [ ] Vérification des fonctions avec `search_path` défini
- [ ] Test des fonctions critiques (notifications, fichiers, etc.)
- [ ] Vérification du linter Supabase
- [ ] Documentation mise à jour

## 🔗 Références

- [Supabase Database Linter - Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [PostgreSQL Search Path Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [OWASP - SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

**Date de création :** 2025-01-29  
**Statut :** ✅ Prêt pour déploiement
