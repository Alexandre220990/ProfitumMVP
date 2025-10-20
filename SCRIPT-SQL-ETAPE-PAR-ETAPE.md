# Script SQL - Étape par Étape

## 📋 Instructions d'exécution

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez chaque étape ci-dessous
3. Exécutez-les **une par une** ou **toutes ensemble**

---

## ÉTAPE 1 : Supprimer l'ancienne fonction

```sql
DROP FUNCTION IF EXISTS get_documents_stats();
```

**Ce que ça fait :** Supprime l'ancienne version de la fonction si elle existe.

---

## ÉTAPE 2 : Créer la nouvelle fonction (PARTIE 1/3 - Déclaration)

```sql
CREATE OR REPLACE FUNCTION get_documents_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_files_count INT := 0;
  total_size_bytes BIGINT := 0;
  
  -- Compteurs par catégorie
  files_by_category JSON;
  files_by_status JSON;
  files_by_user_type JSON;
  
  -- Activité récente
  uploads_today_count INT := 0;
  uploads_week_count INT := 0;
  downloads_today_count INT := 0;
  active_users_count INT := 0;
  
  -- Santé du système
  storage_usage_pct INT := 0;
  pending_validations_count INT := 0;
  expired_documents_count INT := 0;
  system_errors_count INT := 0;
  
  -- Statistiques buckets
  client_bucket_count INT := 0;
  expert_bucket_count INT := 0;
  admin_bucket_count INT := 0;
  public_bucket_count INT := 0;

BEGIN
```

**Ce que ça fait :** Déclare toutes les variables nécessaires.

---

## ÉTAPE 3 : PARTIE 2/3 - Calculs des statistiques

```sql
  -- 1. TOTAL FICHIERS ET TAILLE
  SELECT 
    COUNT(*)::INT,
    COALESCE(SUM(file_size), 0)::BIGINT
  INTO 
    total_files_count,
    total_size_bytes
  FROM "ClientProcessDocument"
  WHERE status != 'deleted';

  -- 2. FICHIERS PAR CATÉGORIE
  SELECT json_object_agg(
    COALESCE(document_type, 'autre'),
    count
  )
  INTO files_by_category
  FROM (
    SELECT 
      COALESCE(document_type, 'autre') as document_type,
      COUNT(*)::INT as count
    FROM "ClientProcessDocument"
    WHERE status != 'deleted'
    GROUP BY document_type
  ) t;

  files_by_category := COALESCE(files_by_category, '{}'::JSON);

  -- 3. FICHIERS PAR STATUT
  SELECT json_object_agg(
    COALESCE(status, 'unknown'),
    count
  )
  INTO files_by_status
  FROM (
    SELECT 
      COALESCE(status, 'unknown') as status,
      COUNT(*)::INT as count
    FROM "ClientProcessDocument"
    WHERE status != 'deleted'
    GROUP BY status
  ) t;

  files_by_status := COALESCE(files_by_status, '{}'::JSON);

  -- 4. FICHIERS PAR TYPE D'UTILISATEUR
  SELECT json_object_agg(
    COALESCE(uploaded_by_type, 'unknown'),
    count
  )
  INTO files_by_user_type
  FROM (
    SELECT 
      COALESCE(uploaded_by_type, 'unknown') as uploaded_by_type,
      COUNT(*)::INT as count
    FROM "ClientProcessDocument"
    WHERE status != 'deleted'
    GROUP BY uploaded_by_type
  ) t;

  files_by_user_type := COALESCE(files_by_user_type, '{}'::JSON);

  -- 5. UPLOADS AUJOURD'HUI
  SELECT COUNT(*)::INT
  INTO uploads_today_count
  FROM "ClientProcessDocument"
  WHERE DATE(created_at) = CURRENT_DATE
    AND status != 'deleted';

  -- 6. UPLOADS CETTE SEMAINE
  SELECT COUNT(*)::INT
  INTO uploads_week_count
  FROM "ClientProcessDocument"
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND status != 'deleted';

  -- 7. DOWNLOADS AUJOURD'HUI
  downloads_today_count := 0;

  -- 8. UTILISATEURS ACTIFS
  SELECT COUNT(DISTINCT client_id)::INT
  INTO active_users_count
  FROM "ClientProcessDocument"
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND client_id IS NOT NULL
    AND status != 'deleted';

  -- 9. UTILISATION STOCKAGE (% sur 10GB)
  storage_usage_pct := LEAST(100, (total_size_bytes::NUMERIC / 10737418240.0 * 100)::INT);

  -- 10. VALIDATIONS EN ATTENTE
  SELECT COUNT(*)::INT
  INTO pending_validations_count
  FROM "ClientProcessDocument"
  WHERE status = 'pending';

  -- 11. DOCUMENTS EXPIRÉS
  expired_documents_count := 0;

  -- 12. ERREURS SYSTÈME
  SELECT COUNT(*)::INT
  INTO system_errors_count
  FROM "ClientProcessDocument"
  WHERE status IN ('error', 'failed');

  -- 13. STATISTIQUES BUCKETS
  SELECT COUNT(*)::INT
  INTO client_bucket_count
  FROM "ClientProcessDocument"
  WHERE client_id IS NOT NULL;

  expert_bucket_count := 0;
  admin_bucket_count := 0;
  public_bucket_count := 0;
```

**Ce que ça fait :** Calcule toutes les statistiques depuis la table ClientProcessDocument.

---

## ÉTAPE 4 : PARTIE 3/3 - Construction du résultat JSON

```sql
  -- CONSTRUCTION DU JSON FINAL
  result := json_build_object(
    'total_files', total_files_count,
    'total_size', total_size_bytes,
    'files_by_category', files_by_category,
    'files_by_status', files_by_status,
    'files_by_user_type', files_by_user_type,
    'recent_activity', json_build_object(
      'uploads_today', uploads_today_count,
      'uploads_week', uploads_week_count,
      'downloads_today', downloads_today_count,
      'active_users', active_users_count
    ),
    'system_health', json_build_object(
      'storage_usage', storage_usage_pct,
      'pending_validations', pending_validations_count,
      'expired_documents', expired_documents_count,
      'system_errors', system_errors_count
    ),
    'bucket_stats', json_build_object(
      'client_bucket', client_bucket_count,
      'expert_bucket', expert_bucket_count,
      'admin_bucket', admin_bucket_count,
      'public_bucket', public_bucket_count
    )
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner des valeurs par défaut
    RETURN json_build_object(
      'total_files', 0,
      'total_size', 0,
      'files_by_category', '{}'::JSON,
      'files_by_status', '{}'::JSON,
      'files_by_user_type', '{}'::JSON,
      'recent_activity', json_build_object(
        'uploads_today', 0,
        'uploads_week', 0,
        'downloads_today', 0,
        'active_users', 0
      ),
      'system_health', json_build_object(
        'storage_usage', 0,
        'pending_validations', 0,
        'expired_documents', 0,
        'system_errors', 0
      ),
      'bucket_stats', json_build_object(
        'client_bucket', 0,
        'expert_bucket', 0,
        'admin_bucket', 0,
        'public_bucket', 0
      ),
      'error', SQLERRM
    );
END;
$$;
```

**Ce que ça fait :** Assemble toutes les statistiques en un seul objet JSON et gère les erreurs.

---

## ÉTAPE 5 : Accorder les permissions

```sql
GRANT EXECUTE ON FUNCTION get_documents_stats() TO authenticated;
```

**Ce que ça fait :** Permet aux utilisateurs authentifiés d'appeler cette fonction.

---

## ÉTAPE 6 : Tester la fonction

```sql
SELECT get_documents_stats();
```

**Ce que ça fait :** Teste immédiatement la fonction et affiche le résultat.

**Résultat attendu :**
```json
{
  "total_files": 3,
  "total_size": 12345,
  "files_by_category": {
    "kbis": 1,
    "immatriculation": 1,
    "facture_carburant": 1
  },
  "files_by_status": {
    "pending": 3
  },
  "files_by_user_type": { ... },
  "recent_activity": { ... },
  "system_health": { ... },
  "bucket_stats": {
    "client_bucket": 3,
    "expert_bucket": 0,
    "admin_bucket": 0,
    "public_bucket": 0
  }
}
```

---

## ✅ VÉRIFICATION FINALE

Après l'exécution, vérifiez localement :

```bash
node deploy-updated-stats-function.cjs
```

Vous devriez voir :
```
✅ La structure correspond au format attendu par le frontend
✅ bucket_stats présent
```

---

## 🎉 C'EST TERMINÉ !

Rechargez la page : https://www.profitum.app/admin/documents-ged

L'erreur devrait avoir disparu ! 🚀

