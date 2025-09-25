-- ============================================================================
-- CORRECTION DES PROBLÈMES IDENTIFIÉS - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Corriger les problèmes spécifiques identifiés dans l'analyse complète

-- ============================================================================
-- 1. CORRECTION DES CONTRAINTES CHECK MANQUANTES
-- ============================================================================

-- Vérifier d'abord si les contraintes existent déjà
DO $$
BEGIN
    -- Contraintes CHECK pour DossierStep
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_step_type_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_step_type_check" 
        CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment'));
        RAISE NOTICE 'Contrainte DossierStep_step_type_check créée';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_step_type_check existe déjà';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_status_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_status_check" 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'));
        RAISE NOTICE 'Contrainte DossierStep_status_check créée';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_status_check existe déjà';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_priority_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_priority_check" 
        CHECK (priority IN ('low', 'medium', 'high', 'critical'));
        RAISE NOTICE 'Contrainte DossierStep_priority_check créée';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_priority_check existe déjà';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_assignee_type_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_assignee_type_check" 
        CHECK (assignee_type IN ('client', 'expert', 'admin'));
        RAISE NOTICE 'Contrainte DossierStep_assignee_type_check créée';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_assignee_type_check existe déjà';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DossierStep_progress_check') THEN
        ALTER TABLE "DossierStep" 
        ADD CONSTRAINT "DossierStep_progress_check" 
        CHECK (progress >= 0 AND progress <= 100);
        RAISE NOTICE 'Contrainte DossierStep_progress_check créée';
    ELSE
        RAISE NOTICE 'Contrainte DossierStep_progress_check existe déjà';
    END IF;

    -- Contraintes CHECK pour ClientProduitEligible
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClientProduitEligible_statut_check') THEN
        ALTER TABLE "ClientProduitEligible" 
        ADD CONSTRAINT "ClientProduitEligible_statut_check" 
        CHECK (statut IN ('eligible', 'ineligible', 'en_cours', 'termine', 'annule'));
        RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check créée';
    ELSE
        RAISE NOTICE 'Contrainte ClientProduitEligible_statut_check existe déjà';
    END IF;

    -- Contraintes CHECK pour GEDDocument
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GEDDocument_category_check') THEN
        ALTER TABLE "GEDDocument" 
        ADD CONSTRAINT "GEDDocument_category_check" 
        CHECK (category IN ('facture', 'contrat', 'rapport', 'certificat', 'autre'));
        RAISE NOTICE 'Contrainte GEDDocument_category_check créée';
    ELSE
        RAISE NOTICE 'Contrainte GEDDocument_category_check existe déjà';
    END IF;

    -- Contraintes CHECK pour expertassignment
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expertassignment_status_check') THEN
        ALTER TABLE expertassignment 
        ADD CONSTRAINT "expertassignment_status_check" 
        CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));
        RAISE NOTICE 'Contrainte expertassignment_status_check créée';
    ELSE
        RAISE NOTICE 'Contrainte expertassignment_status_check existe déjà';
    END IF;

END $$;

-- ============================================================================
-- 2. NETTOYAGE DES INDEX EN DOUBLE
-- ============================================================================

-- Supprimer les index en double sur ClientProduitEligible
DROP INDEX IF EXISTS "idx_clientproduit_client";
DROP INDEX IF EXISTS "idx_clientproduiteligible_client";
DROP INDEX IF EXISTS "idx_clientproduit_produit";
DROP INDEX IF EXISTS "idx_clientproduiteligible_produit";

-- Supprimer les index en double sur GEDDocument
DROP INDEX IF EXISTS "idx_geddocument_category";
DROP INDEX IF EXISTS "idx_geddocument_created_by";

-- ============================================================================
-- 3. CORRECTION DES RÈGLES DE SUPPRESSION CRITIQUES
-- ============================================================================

-- PRIORITÉ 1 : Corrections critiques (NO ACTION → SET NULL)

-- 1. Corriger GEDDocument.created_by vers SET NULL (4 lignes impactées)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'GEDDocument_created_by_fkey' 
               AND table_name = 'GEDDocument') THEN
        
        ALTER TABLE "GEDDocument" DROP CONSTRAINT "GEDDocument_created_by_fkey";
        ALTER TABLE "GEDDocument" 
        ADD CONSTRAINT "GEDDocument_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES "Client"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte GEDDocument_created_by corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte GEDDocument_created_by non trouvée';
    END IF;
END $$;

-- 2. Corriger CalendarEvent.created_by vers SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'CalendarEvent_created_by_fkey' 
               AND table_name = 'CalendarEvent') THEN
        
        ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_created_by_fkey";
        ALTER TABLE "CalendarEvent" 
        ADD CONSTRAINT "CalendarEvent_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES "Client"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte CalendarEvent_created_by corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte CalendarEvent_created_by non trouvée';
    END IF;
END $$;

-- PRIORITÉ 3 : Corrections administratives (NO ACTION → SET NULL)

-- 3. Corriger expertcampaign.created_by vers SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'expertcampaign_created_by_fkey' 
               AND table_name = 'expertcampaign') THEN
        
        ALTER TABLE expertcampaign DROP CONSTRAINT "expertcampaign_created_by_fkey";
        ALTER TABLE expertcampaign 
        ADD CONSTRAINT "expertcampaign_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES "Admin"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte expertcampaign_created_by corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte expertcampaign_created_by non trouvée';
    END IF;
END $$;

-- 4. Corriger expertcriteria.created_by vers SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'expertcriteria_created_by_fkey' 
               AND table_name = 'expertcriteria') THEN
        
        ALTER TABLE expertcriteria DROP CONSTRAINT "expertcriteria_created_by_fkey";
        ALTER TABLE expertcriteria 
        ADD CONSTRAINT "expertcriteria_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES "Admin"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte expertcriteria_created_by corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte expertcriteria_created_by non trouvée';
    END IF;
END $$;

-- 5. Corriger promotionbanner.created_by vers SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'promotionbanner_created_by_fkey' 
               AND table_name = 'promotionbanner') THEN
        
        ALTER TABLE promotionbanner DROP CONSTRAINT "promotionbanner_created_by_fkey";
        ALTER TABLE promotionbanner 
        ADD CONSTRAINT "promotionbanner_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES "Admin"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte promotionbanner_created_by corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte promotionbanner_created_by non trouvée';
    END IF;
END $$;

-- 6. Corriger Expert.approved_by vers SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'Expert_approved_by_fkey' 
               AND table_name = 'Expert') THEN
        
        ALTER TABLE "Expert" DROP CONSTRAINT "Expert_approved_by_fkey";
        ALTER TABLE "Expert" 
        ADD CONSTRAINT "Expert_approved_by_fkey" 
        FOREIGN KEY (approved_by) REFERENCES "Admin"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte Expert_approved_by corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte Expert_approved_by non trouvée';
    END IF;
END $$;

-- 7. Corriger Client.created_by_admin vers SET NULL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'Client_created_by_admin_fkey' 
               AND table_name = 'Client') THEN
        
        ALTER TABLE "Client" DROP CONSTRAINT "Client_created_by_admin_fkey";
        ALTER TABLE "Client" 
        ADD CONSTRAINT "Client_created_by_admin_fkey" 
        FOREIGN KEY (created_by_admin) REFERENCES "Admin"(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte Client_created_by_admin corrigée vers SET NULL';
    ELSE
        RAISE NOTICE 'Contrainte Client_created_by_admin non trouvée';
    END IF;
END $$;

-- ============================================================================
-- 4. ÉVALUATION DE LA RELATION GEDDocument.dossier_id
-- ============================================================================

-- Vérifier si la colonne dossier_id existe dans GEDDocument
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'GEDDocument' 
               AND column_name = 'dossier_id') THEN
        
        -- Créer la contrainte FK si elle n'existe pas
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name LIKE '%GEDDocument_dossier_id%' 
                      AND table_name = 'GEDDocument') THEN
            
            ALTER TABLE "GEDDocument" 
            ADD CONSTRAINT "GEDDocument_dossier_id_fkey" 
            FOREIGN KEY (dossier_id) REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Contrainte GEDDocument_dossier_id créée';
        ELSE
            RAISE NOTICE 'Contrainte GEDDocument_dossier_id existe déjà';
        END IF;
    ELSE
        RAISE NOTICE 'Colonne dossier_id non trouvée dans GEDDocument';
    END IF;
END $$;

-- ============================================================================
-- 5. VÉRIFICATION POST-CORRECTION
-- ============================================================================

-- Vérifier les contraintes CHECK créées
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
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

-- Vérifier les index après nettoyage
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('ClientProduitEligible', 'GEDDocument')
    AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

-- Vérifier les règles de suppression corrigées
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule,
    tc.constraint_name,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Suppression en cascade - OK'
        WHEN rc.delete_rule = 'SET NULL' THEN '✅ Mise à NULL - Corrigé'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ Pas d''action - À corriger'
        ELSE '❓ Règle inconnue'
    END AS delete_rule_analysis
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('GEDDocument', 'CalendarEvent', 'expertcampaign', 'expertcriteria', 'promotionbanner', 'Expert', 'Client')
ORDER BY tc.table_name, kcu.column_name;
