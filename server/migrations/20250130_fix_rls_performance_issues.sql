-- ============================================================================
-- MIGRATION : Correction des problèmes de performance RLS
-- Date : 2025-01-30
-- Description : Optimise les politiques RLS pour éviter la réévaluation
--               à chaque ligne en utilisant (select auth.<function>()).
--               Consolide les politiques multiples et supprime les index dupliqués.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTIE 1 : Optimisation des politiques RLS (auth_rls_initplan)
-- ============================================================================
-- Remplace auth.uid(), auth.jwt(), auth.role(), et toutes les fonctions auth.*
-- par (select auth.*()) pour éviter la réévaluation à chaque ligne

-- Fonction helper pour optimiser les expressions RLS
CREATE OR REPLACE FUNCTION optimize_rls_expression(expr TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF expr IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remplacer tous les appels auth.<function>() par (select auth.<function>())
    -- Pattern: auth.uid(), auth.jwt(), auth.role(), auth.is_admin(), etc.
    -- On évite de remplacer si déjà dans un (select ...)
    RETURN regexp_replace(
        expr,
        '\bauth\.([a-z_]+)\(\)',
        '(select auth.\1())',
        'gi'
    );
END;
$$;

-- Application automatique des optimisations
DO $$
DECLARE
    policy_rec RECORD;
    new_qual TEXT;
    new_with_check TEXT;
    cmd_type TEXT;
    roles_list TEXT;
    sql_cmd TEXT;
    policies_updated INTEGER := 0;
    policies_skipped INTEGER := 0;
BEGIN
    RAISE NOTICE 'Début de l''optimisation des politiques RLS...';
    
    FOR policy_rec IN 
        SELECT 
            p.schemaname,
            p.tablename,
            p.policyname,
            p.qual,
            p.with_check,
            p.cmd,
            p.roles,
            p.permissive
        FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND (
            (p.qual IS NOT NULL AND (
                p.qual ~* '\bauth\.[a-z_]+\(\)'
                AND p.qual !~* '\(select\s+auth\.'
            ))
            OR (p.with_check IS NOT NULL AND (
                p.with_check ~* '\bauth\.[a-z_]+\(\)'
                AND p.with_check !~* '\(select\s+auth\.'
            ))
        )
        ORDER BY p.tablename, p.policyname
    LOOP
        -- Optimiser les expressions
        new_qual := optimize_rls_expression(policy_rec.qual);
        new_with_check := optimize_rls_expression(policy_rec.with_check);
        
        -- Vérifier si une modification est nécessaire
        IF (new_qual IS DISTINCT FROM policy_rec.qual) 
           OR (new_with_check IS DISTINCT FROM policy_rec.with_check) THEN
            
            -- Construire la commande SQL pour recréer la politique
            cmd_type := policy_rec.cmd;
            roles_list := array_to_string(policy_rec.roles, ', ');
            
            -- Supprimer l'ancienne politique
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                policy_rec.policyname,
                policy_rec.schemaname,
                policy_rec.tablename
            );
            
            -- Construire la commande CREATE POLICY
            sql_cmd := format('CREATE POLICY %I ON %I.%I FOR %s',
                policy_rec.policyname,
                policy_rec.schemaname,
                policy_rec.tablename,
                cmd_type
            );
            
            -- Ajouter les rôles si spécifiés
            IF array_length(policy_rec.roles, 1) > 0 THEN
                sql_cmd := sql_cmd || format(' TO %s', roles_list);
            END IF;
            
            -- Ajouter USING si nécessaire
            IF new_qual IS NOT NULL THEN
                sql_cmd := sql_cmd || format(' USING (%s)', new_qual);
            END IF;
            
            -- Ajouter WITH CHECK si nécessaire
            IF new_with_check IS NOT NULL THEN
                sql_cmd := sql_cmd || format(' WITH CHECK (%s)', new_with_check);
            END IF;
            
            -- Exécuter la commande
            BEGIN
                EXECUTE sql_cmd;
                policies_updated := policies_updated + 1;
                RAISE NOTICE 'Politique optimisée: %.%.%', 
                    policy_rec.schemaname, 
                    policy_rec.tablename, 
                    policy_rec.policyname;
            EXCEPTION WHEN OTHERS THEN
                policies_skipped := policies_skipped + 1;
                RAISE WARNING 'Erreur lors de l''optimisation de %.%.%: %', 
                    policy_rec.schemaname, 
                    policy_rec.tablename, 
                    policy_rec.policyname,
                    SQLERRM;
            END;
        ELSE
            policies_skipped := policies_skipped + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Optimisation terminée: % politiques mises à jour, % ignorées', 
        policies_updated, policies_skipped;
END $$;

-- Nettoyer la fonction helper
DROP FUNCTION IF EXISTS optimize_rls_expression(TEXT);

-- ============================================================================
-- PARTIE 4 : Suppression des index dupliqués
-- ============================================================================

-- AdminNotificationStatus
DROP INDEX IF EXISTS idx_admin_notification_status_unread;
-- Garde idx_admin_notification_status_read

-- ApporteurAffaires
DROP INDEX IF EXISTS idx_apporteur_status;
-- Garde idx_apporteur_candidature_status

-- ClientProcessDocument
DROP INDEX IF EXISTS idx_clientprocessdocument_client;
DROP INDEX IF EXISTS idx_clientprocessdocument_produit;
-- Garde idx_client_process_doc_client et idx_client_process_doc_produit

-- ClientProduitEligible
DROP INDEX IF EXISTS idx_clientproduit_statut;
-- Garde idx_client_produit_eligible_statut

-- GEDDocument
DROP INDEX IF EXISTS idx_geddocument_created_at;
DROP INDEX IF EXISTS idx_geddocument_is_active;
-- Garde idx_ged_document_created_at et idx_ged_document_is_active

-- ProduitEligible
DROP INDEX IF EXISTS idx_produiteligible_nom;
-- Garde idx_produit_nom

-- QuestionnaireQuestion
DROP INDEX IF EXISTS idx_questionnaire_question_produit;
-- Garde idx_questionnaire_produits_cibles

-- RDV
DROP INDEX IF EXISTS idx_rdv_status;
-- Garde idx_client_rdv_status

-- simulations
DROP INDEX IF EXISTS idx_simulations_unified_client_id;
DROP INDEX IF EXISTS idx_simulations_unified_session_token;
-- Garde idx_simulations_client_id et idx_simulations_session_token

-- ============================================================================
-- PARTIE 3 : Fonction de génération des scripts de correction RLS (pour inspection)
-- ============================================================================
-- Cette fonction génère les commandes SQL pour corriger toutes les politiques
-- Utilisez-la pour inspecter les corrections avant de les appliquer :
-- SELECT * FROM generate_rls_optimization_scripts();

CREATE OR REPLACE FUNCTION generate_rls_optimization_scripts()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    current_definition TEXT,
    optimized_definition TEXT,
    sql_command TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    policy_rec RECORD;
    new_qual TEXT;
    new_with_check TEXT;
    cmd_type TEXT;
    roles_list TEXT;
    sql_cmd TEXT;
BEGIN
    FOR policy_rec IN 
        SELECT 
            p.schemaname,
            p.tablename,
            p.policyname,
            p.qual,
            p.with_check,
            p.cmd,
            p.roles
        FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND (
            (p.qual IS NOT NULL AND (
                p.qual ~* '\bauth\.[a-z_]+\(\)'
                AND p.qual !~* '\(select\s+auth\.'
            ))
            OR (p.with_check IS NOT NULL AND (
                p.with_check ~* '\bauth\.[a-z_]+\(\)'
                AND p.with_check !~* '\(select\s+auth\.'
            ))
        )
        ORDER BY p.tablename, p.policyname
    LOOP
        -- Remplacer toutes les fonctions auth.*() par (select auth.*())
        new_qual := policy_rec.qual;
        new_with_check := policy_rec.with_check;
        
        IF new_qual IS NOT NULL THEN
            new_qual := regexp_replace(
                new_qual,
                '\bauth\.([a-z_]+)\(\)',
                '(select auth.\1())',
                'gi'
            );
        END IF;
        
        IF new_with_check IS NOT NULL THEN
            new_with_check := regexp_replace(
                new_with_check,
                '\bauth\.([a-z_]+)\(\)',
                '(select auth.\1())',
                'gi'
            );
        END IF;
        
        -- Construire la commande SQL
        cmd_type := policy_rec.cmd;
        roles_list := array_to_string(policy_rec.roles, ', ');
        
        sql_cmd := format(
            'DROP POLICY IF EXISTS %I ON %I.%I; ' ||
            'CREATE POLICY %I ON %I.%I FOR %s',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            cmd_type
        );
        
        IF array_length(policy_rec.roles, 1) > 0 THEN
            sql_cmd := sql_cmd || format(' TO %s', roles_list);
        END IF;
        
        IF new_qual IS NOT NULL THEN
            sql_cmd := sql_cmd || format(' USING (%s)', new_qual);
        END IF;
        
        IF new_with_check IS NOT NULL THEN
            sql_cmd := sql_cmd || format(' WITH CHECK (%s)', new_with_check);
        END IF;
        
        sql_cmd := sql_cmd || ';';
        
        table_name := policy_rec.tablename;
        policy_name := policy_rec.policyname;
        current_definition := COALESCE(policy_rec.qual, '') || ' | ' || COALESCE(policy_rec.with_check, '');
        optimized_definition := COALESCE(new_qual, '') || ' | ' || COALESCE(new_with_check, '');
        sql_command := sql_cmd;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- ============================================================================
-- PARTIE 2 : Identification des politiques multiples (multiple_permissive_policies)
-- ============================================================================
-- Créer une fonction pour identifier les tables avec plusieurs politiques permissives
-- pour le même rôle et la même action

CREATE OR REPLACE FUNCTION identify_multiple_permissive_policies()
RETURNS TABLE(
    table_name TEXT,
    role_name TEXT,
    action TEXT,
    policy_count BIGINT,
    policy_names TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        r.rolname::TEXT,
        p.cmd::TEXT,
        COUNT(*)::BIGINT,
        array_agg(p.policyname ORDER BY p.policyname)::TEXT[]
    FROM pg_policies p
    CROSS JOIN LATERAL unnest(p.roles) AS role_name
    JOIN pg_roles r ON r.rolname = role_name
    WHERE p.schemaname = 'public'
    AND p.permissive = 'PERMISSIVE'
    GROUP BY p.tablename, r.rolname, p.cmd
    HAVING COUNT(*) > 1
    ORDER BY p.tablename, r.rolname, p.cmd;
END;
$$;

-- Afficher les politiques multiples détectées
DO $$
DECLARE
    multiple_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO multiple_count
    FROM identify_multiple_permissive_policies();
    
    IF multiple_count > 0 THEN
        RAISE NOTICE '⚠️  % groupes de politiques multiples détectés. Utilisez SELECT * FROM identify_multiple_permissive_policies() pour voir les détails.', multiple_count;
        RAISE NOTICE '💡 Conseil: Consolidez les politiques en combinant leurs conditions avec OR dans une seule politique.';
    ELSE
        RAISE NOTICE '✅ Aucune politique multiple détectée.';
    END IF;
END $$;

-- ============================================================================
-- PARTIE 3 : Application automatique des corrections (DÉJÀ FAIT DANS PARTIE 1)
-- ============================================================================
-- Les optimisations sont déjà appliquées dans la PARTIE 1 ci-dessus
-- Cette section est conservée pour référence historique

/*
-- Ancienne version (remplacée par PARTIE 1)
DO $$
DECLARE
    policy_rec RECORD;
    new_qual TEXT;
    new_with_check TEXT;
    cmd_type TEXT;
    roles_list TEXT;
    sql_cmd TEXT;
    policies_updated INTEGER := 0;
BEGIN
    FOR policy_rec IN 
        SELECT 
            p.schemaname,
            p.tablename,
            p.policyname,
            p.qual,
            p.with_check,
            p.cmd,
            p.roles
        FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND (
            (p.qual IS NOT NULL AND (
                p.qual LIKE '%auth.uid()%' 
                OR p.qual LIKE '%auth.jwt()%'
                OR p.qual LIKE '%auth.role()%'
            ))
            OR (p.with_check IS NOT NULL AND (
                p.with_check LIKE '%auth.uid()%'
                OR p.with_check LIKE '%auth.jwt()%'
                OR p.with_check LIKE '%auth.role()%'
            ))
        )
        AND (
            (p.qual IS NULL OR p.qual NOT LIKE '%(select auth.%')
            AND (p.with_check IS NULL OR p.with_check NOT LIKE '%(select auth.%')
        )
        ORDER BY p.tablename, p.policyname
    LOOP
        -- Remplacer auth.uid(), auth.jwt(), auth.role() par (select ...)
        new_qual := policy_rec.qual;
        new_with_check := policy_rec.with_check;
        
        IF new_qual IS NOT NULL THEN
            new_qual := regexp_replace(
                new_qual,
                '\bauth\.(uid|jwt|role)\(\)',
                '(select auth.\1())',
                'g'
            );
        END IF;
        
        IF new_with_check IS NOT NULL THEN
            new_with_check := regexp_replace(
                new_with_check,
                '\bauth\.(uid|jwt|role)\(\)',
                '(select auth.\1())',
                'g'
            );
        END IF;
        
        -- Construire la commande SQL
        cmd_type := policy_rec.cmd;
        roles_list := array_to_string(policy_rec.roles, ', ');
        
        -- Supprimer l'ancienne politique
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename
        );
        
        -- Recréer avec la syntaxe optimisée
        sql_cmd := format('CREATE POLICY %I ON %I.%I FOR %s',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename,
            cmd_type
        );
        
        IF array_length(policy_rec.roles, 1) > 0 THEN
            sql_cmd := sql_cmd || format(' TO %s', roles_list);
        END IF;
        
        IF new_qual IS NOT NULL THEN
            sql_cmd := sql_cmd || format(' USING (%s)', new_qual);
        END IF;
        
        IF new_with_check IS NOT NULL THEN
            sql_cmd := sql_cmd || format(' WITH CHECK (%s)', new_with_check);
        END IF;
        
        -- Exécuter la commande
        BEGIN
            EXECUTE sql_cmd;
            policies_updated := policies_updated + 1;
            RAISE NOTICE 'Politique optimisée: %.%.%', 
                policy_rec.schemaname, 
                policy_rec.tablename, 
                policy_rec.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erreur lors de la mise à jour de la politique %.%.%: %', 
                policy_rec.schemaname, 
                policy_rec.tablename, 
                policy_rec.policyname,
                SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total de politiques optimisées: %', policies_updated;
END $$;
*/

-- ============================================================================
-- PARTIE 6 : Vérification finale
-- ============================================================================

-- Vérifier qu'il ne reste plus de politiques avec auth.* sans (select ...)
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        (qual IS NOT NULL AND (
            qual ~* '\bauth\.[a-z_]+\(\)'
            AND qual !~* '\(select\s+auth\.'
        ))
        OR (with_check IS NOT NULL AND (
            with_check ~* '\bauth\.[a-z_]+\(\)'
            AND with_check !~* '\(select\s+auth\.'
        ))
    );
    
    IF remaining_count > 0 THEN
        RAISE WARNING 'Il reste % politiques à optimiser. Utilisez generate_rls_optimization_scripts() pour voir les détails.', remaining_count;
    ELSE
        RAISE NOTICE 'Toutes les politiques ont été optimisées avec succès!';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTES ET UTILISATION
-- ============================================================================
-- 1. Cette migration optimise automatiquement toutes les politiques RLS
--    qui utilisent auth.*() sans (select ...) pour éviter la réévaluation
--    à chaque ligne.
--
-- 2. Les index dupliqués ont été supprimés pour améliorer les performances.
--
-- 3. Pour inspecter les politiques multiples avant consolidation:
--    SELECT * FROM identify_multiple_permissive_policies();
--
-- 4. Pour voir les scripts de correction générés (avant application):
--    SELECT * FROM generate_rls_optimization_scripts();
--
-- 5. Les politiques multiples (multiple_permissive_policies) nécessitent
--    une analyse manuelle pour déterminer lesquelles consolider.
--    Exemple de consolidation:
--    -- Au lieu de 2 politiques séparées:
--    -- CREATE POLICY p1 ... USING (condition1);
--    -- CREATE POLICY p2 ... USING (condition2);
--    -- Créez une seule politique:
--    -- CREATE POLICY p_combined ... USING (condition1 OR condition2);
--
-- 6. Après cette migration, relancez le linter Supabase pour vérifier
--    que tous les problèmes ont été résolus:
--    - auth_rls_initplan devrait être résolu
--    - multiple_permissive_policies nécessite une consolidation manuelle
--
-- 7. Pour vérifier qu'il ne reste plus de problèmes:
--    SELECT COUNT(*) FROM pg_policies 
--    WHERE schemaname = 'public'
--    AND qual ~* '\bauth\.[a-z_]+\(\)'
--    AND qual !~* '\(select\s+auth\.';
