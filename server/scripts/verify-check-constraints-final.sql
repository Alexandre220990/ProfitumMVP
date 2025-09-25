-- ============================================================================
-- VÉRIFICATION FINALE DES CONTRAINTES CHECK - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Vérifier que toutes les contraintes CHECK sont créées

-- ============================================================================
-- 1. VÉRIFICATION COMPLÈTE DES CONTRAINTES CHECK
-- ============================================================================

-- Vérifier toutes les contraintes CHECK créées
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
    AND conname LIKE '%_check'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 2. COMPTAGE CORRECT DES CONTRAINTES CHECK
-- ============================================================================

-- Compter toutes les contraintes CHECK (méthode correcte)
SELECT 
    COUNT(*) as total_check_constraints,
    'Contraintes CHECK créées' as description
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%';

-- ============================================================================
-- 3. VÉRIFICATION PAR TABLE
-- ============================================================================

-- Afficher le résumé des contraintes par table
SELECT 
    conrelid::regclass AS table_name,
    COUNT(*) as nombre_contraintes_check
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
    AND conname LIKE '%_check'
GROUP BY conrelid::regclass
ORDER BY table_name;

-- ============================================================================
-- 4. VÉRIFICATION DES CONTRAINTES SPÉCIFIQUES
-- ============================================================================

-- Vérifier les contraintes spécifiques que nous avons créées
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    CASE 
        WHEN conname = 'DossierStep_step_type_check' THEN '✅ Créée'
        WHEN conname = 'DossierStep_status_check' THEN '✅ Créée'
        WHEN conname = 'DossierStep_priority_check' THEN '✅ Créée'
        WHEN conname = 'DossierStep_assignee_type_check' THEN '✅ Créée'
        WHEN conname = 'DossierStep_progress_check' THEN '✅ Créée'
        WHEN conname = 'ClientProduitEligible_statut_check' THEN '✅ Créée'
        WHEN conname = 'GEDDocument_category_check' THEN '✅ Créée'
        WHEN conname = 'expertassignment_status_check' THEN '✅ Créée'
        ELSE '❓ Autre contrainte'
    END AS status
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
    AND conname IN (
        'DossierStep_step_type_check',
        'DossierStep_status_check',
        'DossierStep_priority_check',
        'DossierStep_assignee_type_check',
        'DossierStep_progress_check',
        'ClientProduitEligible_statut_check',
        'GEDDocument_category_check',
        'expertassignment_status_check'
    )
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 5. RÉSUMÉ FINAL
-- ============================================================================

-- Afficher le résumé final complet
SELECT 
    'RÉSUMÉ FINAL' as section,
    'Contraintes CHECK créées avec succès' as description,
    COUNT(*) as total
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
    AND conname LIKE '%_check';
