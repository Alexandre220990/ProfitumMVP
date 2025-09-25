-- ============================================================================
-- ANALYSE APPROFONDIE SUPABASE - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Analyser en profondeur pourquoi les contraintes CHECK ne sont pas créées
-- Basé sur la documentation officielle Supabase

-- ============================================================================
-- 1. VÉRIFICATION COMPLÈTE DES CONTRAINTES CHECK
-- ============================================================================

-- Méthode 1 : Vérification directe des contraintes CHECK
SELECT 
    'MÉTHODE 1 - Contraintes CHECK directes' as method,
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c'
ORDER BY table_name, constraint_name;

-- Méthode 2 : Vérification via information_schema
SELECT 
    'MÉTHODE 2 - Via information_schema' as method,
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE constraint_type = 'CHECK'
    AND table_schema = 'public'
ORDER BY table_name, constraint_name;

-- Méthode 3 : Vérification via pg_constraint avec schéma explicite
SELECT 
    'MÉTHODE 3 - Schéma explicite' as method,
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c'
    AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 2. ANALYSE DES PERMISSIONS ET DROITS
-- ============================================================================

-- Vérifier les permissions sur les tables
SELECT 
    'PERMISSIONS' as analysis_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('DossierStep', 'ClientProduitEligible', 'GEDDocument', 'expertassignment')
ORDER BY tablename;

-- Vérifier les permissions de l'utilisateur actuel
SELECT 
    'USER PERMISSIONS' as analysis_type,
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database,
    current_schema() as current_schema;

-- ============================================================================
-- 3. ANALYSE DES CONTRAINTES EXISTANTES PAR TYPE
-- ============================================================================

-- Analyser tous les types de contraintes
SELECT 
    'CONSTRAINT TYPES' as analysis_type,
    contype,
    CASE contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'x' THEN 'EXCLUDE'
        ELSE 'OTHER'
    END as constraint_type_name,
    COUNT(*) as count
FROM pg_constraint 
WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY contype
ORDER BY contype;

-- ============================================================================
-- 4. ANALYSE SPÉCIFIQUE DES TABLES CIBLES
-- ============================================================================

-- Analyser DossierStep
SELECT 
    'DOSSIERSTEP ANALYSIS' as analysis_type,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'DossierStep'::regclass
ORDER BY constraint_name;

-- Analyser ClientProduitEligible
SELECT 
    'CLIENTPRODUITELIGIBLE ANALYSIS' as analysis_type,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'ClientProduitEligible'::regclass
ORDER BY constraint_name;

-- Analyser GEDDocument
SELECT 
    'GEDDOCUMENT ANALYSIS' as analysis_type,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'GEDDocument'::regclass
ORDER BY constraint_name;

-- Analyser expertassignment
SELECT 
    'EXPERTASSIGNMENT ANALYSIS' as analysis_type,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'expertassignment'::regclass
ORDER BY constraint_name;

-- ============================================================================
-- 5. TEST DE CRÉATION MANUELLE AVEC GESTION D'ERREURS
-- ============================================================================

-- Test de création manuelle avec gestion d'erreurs
DO $$
DECLARE
    error_message TEXT;
BEGIN
    RAISE NOTICE '=== TEST DE CRÉATION MANUELLE ===';
    
    -- Test 1 : DossierStep_step_type_check
    BEGIN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_step_type_check" 
        CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment'));
        RAISE NOTICE 'SUCCÈS: DossierStep_step_type_check créée';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'INFO: DossierStep_step_type_check existe déjà';
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
            RAISE NOTICE 'ERREUR: DossierStep_step_type_check - %', error_message;
    END;
    
    -- Test 2 : ClientProduitEligible_statut_check
    BEGIN
        ALTER TABLE "ClientProduitEligible" 
        ADD CONSTRAINT "ClientProduitEligible_statut_check" 
        CHECK (statut IN ('eligible', 'ineligible', 'en_cours', 'termine', 'annule'));
        RAISE NOTICE 'SUCCÈS: ClientProduitEligible_statut_check créée';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'INFO: ClientProduitEligible_statut_check existe déjà';
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
            RAISE NOTICE 'ERREUR: ClientProduitEligible_statut_check - %', error_message;
    END;
    
    RAISE NOTICE '=== FIN DES TESTS ===';
END $$;

-- ============================================================================
-- 6. VÉRIFICATION FINALE POST-TEST
-- ============================================================================

-- Vérifier les contraintes CHECK après les tests
SELECT 
    'POST-TEST VERIFICATION' as analysis_type,
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c'
    AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY table_name, constraint_name;

-- Compter les contraintes CHECK après les tests
SELECT 
    'FINAL COUNT' as analysis_type,
    COUNT(*) as total_check_constraints,
    'Contraintes CHECK après tests' as description
FROM pg_constraint 
WHERE contype = 'c'
    AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
