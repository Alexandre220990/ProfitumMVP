-- Script de correction des structures de tables pour la migration
-- Date: 2025-01-27
-- Objectif: Assurer la compatibilité entre tables temporaires et finales

-- =====================================================
-- 1. CORRECTION DE LA TABLE CLIENTPRODUITELIGIBLE
-- =====================================================

-- Vérifier et ajouter les colonnes manquantes
DO $$ 
BEGIN
    -- Ajouter metadata si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "metadata" JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Colonne metadata ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter notes si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "notes" TEXT;
        RAISE NOTICE 'Colonne notes ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter priorite si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'priorite'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "priorite" INTEGER DEFAULT 1;
        RAISE NOTICE 'Colonne priorite ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter dateEligibilite si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'dateEligibilite'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "dateEligibilite" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne dateEligibilite ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter current_step si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'current_step'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "current_step" INTEGER DEFAULT 0;
        RAISE NOTICE 'Colonne current_step ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter progress si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'progress'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "progress" INTEGER DEFAULT 0;
        RAISE NOTICE 'Colonne progress ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter expert_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'expert_id'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "expert_id" UUID;
        RAISE NOTICE 'Colonne expert_id ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter charte_signed si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'charte_signed'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "charte_signed" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Colonne charte_signed ajoutée à ClientProduitEligible';
    END IF;

    -- Ajouter charte_signed_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'charte_signed_at'
    ) THEN
        ALTER TABLE "ClientProduitEligible" ADD COLUMN "charte_signed_at" TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne charte_signed_at ajoutée à ClientProduitEligible';
    END IF;

END $$;

-- =====================================================
-- 2. CORRECTION DES TYPES DE DONNÉES
-- =====================================================

-- Corriger le type de simulationId
ALTER TABLE "ClientProduitEligible" 
ALTER COLUMN "simulationId" TYPE BIGINT USING "simulationId"::bigint;

-- =====================================================
-- 3. AJOUT DES CONTRAINTES DE VALIDATION
-- =====================================================

-- Supprimer les contraintes existantes si elles existent
DO $$ 
BEGIN
    -- Supprimer les contraintes de check si elles existent
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_statut_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_statut_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_tauxFinal_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_tauxFinal_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_montantFinal_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_montantFinal_check";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'ClientProduitEligible' 
               AND constraint_name = 'client_produit_eligible_dureeFinale_check') THEN
        ALTER TABLE "ClientProduitEligible" DROP CONSTRAINT "client_produit_eligible_dureeFinale_check";
    END IF;
END $$;

-- Ajouter les nouvelles contraintes
ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_statut_check" 
CHECK (statut IN ('eligible', 'non_eligible', 'en_cours', 'termine', 'annule'));

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_tauxFinal_check" 
CHECK ("tauxFinal" >= 0 AND "tauxFinal" <= 1);

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_montantFinal_check" 
CHECK ("montantFinal" >= 0);

ALTER TABLE "ClientProduitEligible" 
ADD CONSTRAINT "client_produit_eligible_dureeFinale_check" 
CHECK ("dureeFinale" > 0);

-- =====================================================
-- 4. AJOUT DES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_clientId" ON "ClientProduitEligible" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_produitId" ON "ClientProduitEligible" ("produitId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_simulationId" ON "ClientProduitEligible" ("simulationId");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_statut" ON "ClientProduitEligible" (statut);
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_created_at" ON "ClientProduitEligible" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_client_produit_eligible_priorite" ON "ClientProduitEligible" ("priorite");

-- =====================================================
-- 5. CORRECTION DE LA TABLE PRODUITELIGIBLE
-- =====================================================

-- Ajouter les colonnes manquantes à ProduitEligible
DO $$ 
BEGIN
    -- Ajouter categorie si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'categorie'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "categorie" text;
        RAISE NOTICE 'Colonne categorie ajoutée à ProduitEligible';
    END IF;

    -- Ajouter montant_min si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'montant_min'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "montant_min" double precision;
        RAISE NOTICE 'Colonne montant_min ajoutée à ProduitEligible';
    END IF;

    -- Ajouter montant_max si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'montant_max'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "montant_max" double precision;
        RAISE NOTICE 'Colonne montant_max ajoutée à ProduitEligible';
    END IF;

    -- Ajouter taux_min si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'taux_min'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "taux_min" double precision;
        RAISE NOTICE 'Colonne taux_min ajoutée à ProduitEligible';
    END IF;

    -- Ajouter taux_max si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'taux_max'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "taux_max" double precision;
        RAISE NOTICE 'Colonne taux_max ajoutée à ProduitEligible';
    END IF;

    -- Ajouter duree_min si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'duree_min'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "duree_min" integer;
        RAISE NOTICE 'Colonne duree_min ajoutée à ProduitEligible';
    END IF;

    -- Ajouter duree_max si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'duree_max'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "duree_max" integer;
        RAISE NOTICE 'Colonne duree_max ajoutée à ProduitEligible';
    END IF;

END $$;

-- =====================================================
-- 6. NETTOYAGE DES TABLES TEMPORAIRES OBSOLÈTES
-- =====================================================

-- Supprimer les tables temporaires obsolètes
DROP TABLE IF EXISTS "TemporarySession" CASCADE;
DROP TABLE IF EXISTS "TemporaryEligibility" CASCADE;
DROP TABLE IF EXISTS "TemporaryResponse" CASCADE;
DROP TABLE IF EXISTS "SimulatorAnalytics" CASCADE;

-- =====================================================
-- 7. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que toutes les colonnes nécessaires existent
SELECT 
    'Vérification finale' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
    AND column_name IN (
        'id', 'clientId', 'produitId', 'statut', 'tauxFinal', 
        'montantFinal', 'dureeFinale', 'simulationId', 'metadata',
        'notes', 'priorite', 'dateEligibilite', 'current_step',
        'progress', 'expert_id', 'charte_signed', 'charte_signed_at',
        'created_at', 'updated_at'
    )
ORDER BY ordinal_position;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Correction des structures de tables terminée avec succès !';
    RAISE NOTICE '✅ Toutes les colonnes nécessaires sont présentes';
    RAISE NOTICE '✅ Les contraintes de validation sont en place';
    RAISE NOTICE '✅ Les index de performance sont créés';
    RAISE NOTICE '✅ Les tables temporaires obsolètes sont supprimées';
END $$; 