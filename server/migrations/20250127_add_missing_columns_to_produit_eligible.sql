-- Migration pour ajouter les colonnes manquantes à ProduitEligible
-- Date: 2025-01-27

-- Ajouter les colonnes manquantes si elles n'existent pas déjà
DO $$ 
BEGIN
    -- Ajouter categorie
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'categorie'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "categorie" text;
        RAISE NOTICE 'Colonne categorie ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne categorie existe déjà dans ProduitEligible';
    END IF;

    -- Ajouter montant_min
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'montant_min'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "montant_min" double precision;
        RAISE NOTICE 'Colonne montant_min ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne montant_min existe déjà dans ProduitEligible';
    END IF;

    -- Ajouter montant_max
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'montant_max'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "montant_max" double precision;
        RAISE NOTICE 'Colonne montant_max ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne montant_max existe déjà dans ProduitEligible';
    END IF;

    -- Ajouter taux_min
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'taux_min'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "taux_min" double precision;
        RAISE NOTICE 'Colonne taux_min ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne taux_min existe déjà dans ProduitEligible';
    END IF;

    -- Ajouter taux_max
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'taux_max'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "taux_max" double precision;
        RAISE NOTICE 'Colonne taux_max ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne taux_max existe déjà dans ProduitEligible';
    END IF;

    -- Ajouter duree_min
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'duree_min'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "duree_min" integer;
        RAISE NOTICE 'Colonne duree_min ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne duree_min existe déjà dans ProduitEligible';
    END IF;

    -- Ajouter duree_max
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ProduitEligible' 
        AND column_name = 'duree_max'
    ) THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN "duree_max" integer;
        RAISE NOTICE 'Colonne duree_max ajoutée à ProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne duree_max existe déjà dans ProduitEligible';
    END IF;

END $$; 