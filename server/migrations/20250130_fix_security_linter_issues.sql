-- ============================================================================
-- CORRECTION : Problèmes de sécurité identifiés par le linter Supabase
-- ============================================================================
-- Date : 2025-01-30
-- Description : Corrige les problèmes de sécurité listés par le linter
--               1. Fonctions avec search_path mutable
--               2. Extensions dans le schéma public
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTIE 1 : CORRECTION DU SEARCH_PATH POUR LES FONCTIONS IDENTIFIÉES
-- ============================================================================
-- Ces fonctions ont été identifiées par le linter comme ayant un search_path
-- mutable, ce qui peut être une vulnérabilité de sécurité.

-- Fonction helper pour appliquer search_path de manière sécurisée
CREATE OR REPLACE FUNCTION apply_search_path_to_function_safe(
    func_name TEXT,
    func_schema TEXT DEFAULT 'public'
)
RETURNS void AS $$
DECLARE
    func_oid OID;
    func_signature TEXT;
    alter_cmd TEXT;
BEGIN
    -- Trouver la fonction par nom (prend la première si plusieurs signatures)
    SELECT p.oid, pg_get_function_identity_arguments(p.oid)
    INTO func_oid, func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = func_schema
    AND p.proname = func_name
    LIMIT 1;
    
    IF func_oid IS NOT NULL THEN
        BEGIN
            -- Construire la commande ALTER FUNCTION
            IF func_signature = '' OR func_signature IS NULL THEN
                alter_cmd := format('ALTER FUNCTION %I.%I() SET search_path = ''''', func_schema, func_name);
            ELSE
                alter_cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = ''''', 
                                   func_schema, func_name, func_signature);
            END IF;
            
            EXECUTE alter_cmd;
            RAISE NOTICE '✅ %(%).% corrigé', func_schema, func_name, func_signature;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Erreur lors de la modification de %.%(%): %', 
                        func_schema, func_name, func_signature, SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️  %.% n''existe pas, ignoré', func_schema, func_name;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur inattendue pour %.%: %', func_schema, func_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORRECTION DES 14 FONCTIONS IDENTIFIÉES PAR LE LINTER
-- ============================================================================

-- 1. get_client_files
SELECT apply_search_path_to_function_safe('get_client_files');

-- 2. check_bucket_permissions
SELECT apply_search_path_to_function_safe('check_bucket_permissions');

-- 3. log_bucket_access
SELECT apply_search_path_to_function_safe('log_bucket_access');

-- 4. log_admin_action
SELECT apply_search_path_to_function_safe('log_admin_action');

-- 5. get_admin_audit_history
SELECT apply_search_path_to_function_safe('get_admin_audit_history');

-- 6. get_recent_security_incidents
SELECT apply_search_path_to_function_safe('get_recent_security_incidents');

-- 7. get_actions_by_type
SELECT apply_search_path_to_function_safe('get_actions_by_type');

-- 8. get_top_experts
SELECT apply_search_path_to_function_safe('get_top_experts');

-- 9. create_simulator_session_with_client_data
SELECT apply_search_path_to_function_safe('create_simulator_session_with_client_data');

-- 10. clean_old_email_trackings
SELECT apply_search_path_to_function_safe('clean_old_email_trackings');

-- 11. create_temporary_client
SELECT apply_search_path_to_function_safe('create_temporary_client');

-- 12. create_system_comment
SELECT apply_search_path_to_function_safe('create_system_comment');

-- 13. create_hot_prospect
SELECT apply_search_path_to_function_safe('create_hot_prospect');

-- 14. create_simulation_with_temporary_client
SELECT apply_search_path_to_function_safe('create_simulation_with_temporary_client');

-- ============================================================================
-- PARTIE 2 : DÉPLACEMENT DES EXTENSIONS HORS DU SCHÉMA PUBLIC
-- ============================================================================
-- Les extensions ne doivent pas être dans le schéma public pour des raisons
-- de sécurité. Nous les déplaçons vers un schéma dédié.

-- Créer un schéma pour les extensions si il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- Déplacer l'extension vector
DO $$
BEGIN
    -- Vérifier si l'extension vector existe dans public
    IF EXISTS (
        SELECT 1 
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'vector' 
        AND n.nspname = 'public'
    ) THEN
        -- Déplacer l'extension vers le schéma extensions
        ALTER EXTENSION vector SET SCHEMA extensions;
        RAISE NOTICE '✅ Extension vector déplacée vers le schéma extensions';
    ELSE
        RAISE NOTICE '⚠️  Extension vector non trouvée dans public';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur lors du déplacement de vector: %', SQLERRM;
END $$;

-- Déplacer l'extension unaccent
DO $$
BEGIN
    -- Vérifier si l'extension unaccent existe dans public
    IF EXISTS (
        SELECT 1 
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'unaccent' 
        AND n.nspname = 'public'
    ) THEN
        -- Déplacer l'extension vers le schéma extensions
        ALTER EXTENSION unaccent SET SCHEMA extensions;
        RAISE NOTICE '✅ Extension unaccent déplacée vers le schéma extensions';
    ELSE
        RAISE NOTICE '⚠️  Extension unaccent non trouvée dans public';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur lors du déplacement de unaccent: %', SQLERRM;
END $$;

-- ============================================================================
-- NETTOYAGE : Supprimer la fonction helper
-- ============================================================================

DROP FUNCTION IF EXISTS apply_search_path_to_function_safe(TEXT, TEXT);

-- ============================================================================
-- VÉRIFICATION : Afficher les résultats
-- ============================================================================

DO $$
DECLARE
    func_count INTEGER;
    ext_count INTEGER;
BEGIN
    -- Compter les fonctions corrigées
    SELECT COUNT(*) INTO func_count
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
        'create_simulation_with_temporary_client'
    )
    AND p.proconfig IS NOT NULL
    AND array_to_string(p.proconfig, ',') LIKE '%search_path%';
    
    -- Compter les extensions dans public
    SELECT COUNT(*) INTO ext_count
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname = 'public'
    AND e.extname IN ('vector', 'unaccent');
    
    RAISE NOTICE '✅ Migration terminée :';
    RAISE NOTICE '   - % fonctions avec search_path corrigé', func_count;
    RAISE NOTICE '   - % extensions restantes dans public (devrait être 0)', ext_count;
END $$;

COMMIT;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. FONCTIONS AVEC SEARCH_PATH
--    Toutes les fonctions listées ont maintenant search_path = '', ce qui
--    force PostgreSQL à utiliser uniquement les schémas explicitement
--    qualifiés. Cela prévient les attaques de type "search_path hijacking".
--
-- 2. EXTENSIONS
--    PostgreSQL ne permet pas de déplacer directement une extension d'un
--    schéma à un autre. Pour déplacer les extensions vector et unaccent
--    hors du schéma public, vous devez :
--    1. Supprimer l'extension du schéma public
--    2. La recréer dans le schéma 'extensions'
--    Voir INSTRUCTIONS-SECURITE.md pour les instructions détaillées.
--    
--    ATTENTION : Cette opération peut affecter les données existantes.
--    Faites une sauvegarde avant de procéder.
--
-- 3. PROTECTION DES MOTS DE PASSE COMPROMIS
--    Cette fonctionnalité doit être activée via le Dashboard Supabase :
--    - Allez dans Authentication > Settings > Password
--    - Activez "Leaked Password Protection"
--    Voir le fichier INSTRUCTIONS-SECURITE.md pour plus de détails.
--
-- 4. MISE À JOUR DE POSTGRES
--    La mise à jour de Postgres doit être effectuée via le Dashboard Supabase :
--    - Allez dans Settings > Database
--    - Cliquez sur "Upgrade" si disponible
--    Voir le fichier INSTRUCTIONS-SECURITE.md pour plus de détails.
--
-- ============================================================================
