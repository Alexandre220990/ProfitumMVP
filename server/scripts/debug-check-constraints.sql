-- ============================================================================
-- DIAGNOSTIC DES CONTRAINTES CHECK - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Diagnostiquer pourquoi les contraintes CHECK ne sont pas créées

-- ============================================================================
-- 1. VÉRIFICATION DES CONTRAINTES CHECK EXISTANTES
-- ============================================================================

-- Vérifier toutes les contraintes CHECK existantes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    contype AS constraint_type
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 2. VÉRIFICATION DES COLONNES ET TYPES DE DONNÉES
-- ============================================================================

-- Vérifier les colonnes de DossierStep
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'DossierStep' 
    AND column_name IN ('step_type', 'status', 'priority', 'assignee_type', 'progress')
ORDER BY ordinal_position;

-- Vérifier les colonnes de ClientProduitEligible
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
    AND column_name = 'statut'
ORDER BY ordinal_position;

-- Vérifier les colonnes de GEDDocument
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'GEDDocument' 
    AND column_name = 'category'
ORDER BY ordinal_position;

-- Vérifier les colonnes de expertassignment
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'expertassignment' 
    AND column_name = 'status'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. TEST DE CRÉATION MANUELLE DES CONTRAINTES
-- ============================================================================

-- Test 1 : Contrainte DossierStep_step_type_check
DO $$
BEGIN
    RAISE NOTICE 'Test de création de contrainte DossierStep_step_type_check...';
    
    -- Vérifier si la contrainte existe déjà
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_step_type_check') THEN
        RAISE NOTICE 'Contrainte DossierStep_step_type_check existe déjà';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_step_type_check n''existe pas';
        
        -- Vérifier les valeurs actuelles dans step_type
        RAISE NOTICE 'Valeurs actuelles dans step_type:';
        PERFORM RAISE NOTICE 'Valeur: %', step_type FROM "DossierStep" GROUP BY step_type;
        
        -- Tenter de créer la contrainte
        BEGIN
            ALTER TABLE "DossierStep" 
            ADD CONSTRAINT "DossierStep_step_type_check" 
            CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment'));
            RAISE NOTICE 'Contrainte DossierStep_step_type_check créée avec succès';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la création: %', SQLERRM;
        END;
    END IF;
END $$;

-- Test 2 : Contrainte ClientProduitEligible_statut_check
DO $$
BEGIN
    RAISE NOTICE 'Test de création de contrainte ClientProduitEligible_statut_check...';
    
    -- Vérifier si la contrainte existe déjà
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientProduitEligible_statut_check') THEN
        RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check existe déjà';
    ELSE
        RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check n''existe pas';
        
        -- Vérifier les valeurs actuelles dans statut
        RAISE NOTICE 'Valeurs actuelles dans statut:';
        PERFORM RAISE NOTICE 'Valeur: %', statut FROM "ClientProduitEligible" GROUP BY statut;
        
        -- Tenter de créer la contrainte
        BEGIN
            ALTER TABLE "ClientProduitEligible" 
            ADD CONSTRAINT "ClientProduitEligible_statut_check" 
            CHECK (statut IN ('eligible', 'ineligible', 'en_cours', 'termine', 'annule'));
            RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check créée avec succès';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la création: %', SQLERRM;
        END;
    END IF;
END $$;

-- ============================================================================
-- 4. VÉRIFICATION DES VALEURS ACTUELLES
-- ============================================================================

-- Vérifier les valeurs uniques dans chaque colonne
SELECT 'DossierStep.step_type' as table_column, step_type as value, COUNT(*) as count
FROM "DossierStep" 
GROUP BY step_type
UNION ALL
SELECT 'DossierStep.status' as table_column, status as value, COUNT(*) as count
FROM "DossierStep" 
GROUP BY status
UNION ALL
SELECT 'DossierStep.priority' as table_column, priority as value, COUNT(*) as count
FROM "DossierStep" 
GROUP BY priority
UNION ALL
SELECT 'DossierStep.assignee_type' as table_column, assignee_type as value, COUNT(*) as count
FROM "DossierStep" 
GROUP BY assignee_type
UNION ALL
SELECT 'ClientProduitEligible.statut' as table_column, statut as value, COUNT(*) as count
FROM "ClientProduitEligible" 
GROUP BY statut
UNION ALL
SELECT 'GEDDocument.category' as table_column, category as value, COUNT(*) as count
FROM "GEDDocument" 
GROUP BY category
UNION ALL
SELECT 'expertassignment.status' as table_column, status as value, COUNT(*) as count
FROM expertassignment 
GROUP BY status
ORDER BY table_column, value;

-- ============================================================================
-- 5. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier les contraintes CHECK après les tests
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
    AND conname LIKE '%_check'
ORDER BY table_name, constraint_name;
