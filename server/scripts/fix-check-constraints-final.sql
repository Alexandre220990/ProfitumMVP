-- ============================================================================
-- CORRECTION FINALE DES CONTRAINTES CHECK - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Créer les contraintes CHECK avec la syntaxe corrigée

-- ============================================================================
-- 1. CRÉATION DES CONTRAINTES CHECK POUR DossierStep
-- ============================================================================

-- Contrainte pour step_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_step_type_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_step_type_check" 
        CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment'));
        RAISE NOTICE 'Contrainte DossierStep_step_type_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_step_type_check existe déjà';
    END IF;
END $$;

-- Contrainte pour status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_status_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_status_check" 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'));
        RAISE NOTICE 'Contrainte DossierStep_status_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_status_check existe déjà';
    END IF;
END $$;

-- Contrainte pour priority
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_priority_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_priority_check" 
        CHECK (priority IN ('low', 'medium', 'high', 'critical'));
        RAISE NOTICE 'Contrainte DossierStep_priority_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_priority_check existe déjà';
    END IF;
END $$;

-- Contrainte pour assignee_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_assignee_type_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_assignee_type_check" 
        CHECK (assignee_type IN ('client', 'expert', 'admin'));
        RAISE NOTICE 'Contrainte DossierStep_assignee_type_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_assignee_type_check existe déjà';
    END IF;
END $$;

-- Contrainte pour progress
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_progress_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_progress_check" 
        CHECK (progress >= 0 AND progress <= 100);
        RAISE NOTICE 'Contrainte DossierStep_progress_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_progress_check existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 2. CRÉATION DES CONTRAINTES CHECK POUR ClientProduitEligible
-- ============================================================================

-- Contrainte pour statut
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientProduitEligible_statut_check') THEN
        ALTER TABLE "ClientProduitEligible" 
        ADD CONSTRAINT "ClientProduitEligible_statut_check" 
        CHECK (statut IN ('eligible', 'ineligible', 'en_cours', 'termine', 'annule'));
        RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 3. CRÉATION DES CONTRAINTES CHECK POUR GEDDocument
-- ============================================================================

-- Contrainte pour category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GEDDocument_category_check') THEN
        ALTER TABLE "GEDDocument" 
        ADD CONSTRAINT "GEDDocument_category_check" 
        CHECK (category IN ('facture', 'contrat', 'rapport', 'certificat', 'autre', 'eligibilite_urssaf', 'technical'));
        RAISE NOTICE 'Contrainte GEDDocument_category_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte GEDDocument_category_check existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 4. CRÉATION DES CONTRAINTES CHECK POUR expertassignment
-- ============================================================================

-- Contrainte pour status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expertassignment_status_check') THEN
        ALTER TABLE expertassignment 
        ADD CONSTRAINT "expertassignment_status_check" 
        CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));
        RAISE NOTICE 'Contrainte expertassignment_status_check créée avec succès';
    ELSE
        RAISE NOTICE 'Contrainte expertassignment_status_check existe déjà';
    END IF;
END $$;

-- ============================================================================
-- 5. VÉRIFICATION FINALE
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

-- Vérifier le nombre total de contraintes CHECK
SELECT 
    COUNT(*) as total_check_constraints,
    'Contraintes CHECK créées' as description
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%';

-- ============================================================================
-- 6. TEST DE VALIDATION
-- ============================================================================

-- Test d'insertion avec contraintes CHECK
DO $$
BEGIN
    RAISE NOTICE 'Test de validation des contraintes CHECK...';
    
    -- Test DossierStep
    BEGIN
        INSERT INTO "DossierStep" (step_type, status, priority, assignee_type, progress, dossier_id)
        VALUES ('test_invalid', 'pending', 'medium', 'client', 50, '00000000-0000-0000-0000-000000000000');
        RAISE NOTICE 'ERREUR: Insertion invalide réussie (ne devrait pas arriver)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'SUCCÈS: Contrainte DossierStep_step_type_check fonctionne';
        ROLLBACK;
    END;
    
    -- Test ClientProduitEligible
    BEGIN
        INSERT INTO "ClientProduitEligible" (statut, "clientId", "produitId")
        VALUES ('test_invalid', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
        RAISE NOTICE 'ERREUR: Insertion invalide réussie (ne devrait pas arriver)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'SUCCÈS: Contrainte ClientProduitEligible_statut_check fonctionne';
        ROLLBACK;
    END;
    
    RAISE NOTICE 'Tests de validation terminés';
END $$;
