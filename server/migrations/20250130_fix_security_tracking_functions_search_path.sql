-- ============================================================================
-- CORRECTION : search_path mutable pour les fonctions de suivi de sécurité
-- ============================================================================
-- Date : 2025-01-30
-- Description : Corrige le search_path mutable pour les fonctions :
--               - check_security_issues_status
--               - mark_security_issue_resolved
-- ============================================================================

BEGIN;

-- ============================================================================
-- CORRECTION DU SEARCH_PATH POUR LES FONCTIONS DE SUIVI DE SÉCURITÉ
-- ============================================================================

-- Fonction check_security_issues_status
-- Cette fonction vérifie l'état des problèmes de sécurité
ALTER FUNCTION public.check_security_issues_status() 
SET search_path = '';

-- Fonction mark_security_issue_resolved
-- Cette fonction marque un problème de sécurité comme résolu
ALTER FUNCTION public.mark_security_issue_resolved(TEXT, TEXT) 
SET search_path = '';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
    func_count INTEGER;
BEGIN
    -- Vérifier que les fonctions ont bien le search_path fixé
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname IN ('check_security_issues_status', 'mark_security_issue_resolved')
    AND p.proconfig IS NOT NULL
    AND array_to_string(p.proconfig, ',') LIKE '%search_path=%';
    
    IF func_count = 2 THEN
        RAISE NOTICE '✅ Les deux fonctions ont été corrigées avec succès';
    ELSE
        RAISE WARNING '⚠️  Seulement % fonction(s) sur 2 ont été corrigées', func_count;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
Cette migration corrige le problème de sécurité "function_search_path_mutable"
pour les fonctions de suivi des problèmes de sécurité.

En définissant search_path = '', nous forçons PostgreSQL à utiliser uniquement
les schémas explicitement qualifiés dans le code des fonctions, ce qui prévient
les attaques par injection de schéma.

Les deux fonctions corrigées :
1. check_security_issues_status() - Vérifie l'état des problèmes de sécurité
2. mark_security_issue_resolved(TEXT, TEXT) - Marque un problème comme résolu

Ces fonctions ont été créées dans la migration 20250130_document_security_issues_auth_postgres.sql
mais n'avaient pas le search_path fixé à ce moment-là.
*/
