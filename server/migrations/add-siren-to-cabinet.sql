-- ============================================================================
-- Migration : Ajout colonne SIREN à la table Cabinet
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Ajouter la colonne siren pour préremplir le formulaire d'ajout de collaborateur
-- Impact: 0 downtime, non-destructif, rétrocompatible
-- ============================================================================

BEGIN;

-- Ajouter la colonne siren à la table Cabinet
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Cabinet' AND column_name = 'siren'
  ) THEN
    ALTER TABLE "Cabinet" ADD COLUMN siren TEXT;
    RAISE NOTICE '✅ Colonne Cabinet.siren ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne Cabinet.siren existe déjà';
  END IF;
END $$;

-- Optionnel : Migrer les données existantes depuis siret (extraire les 9 premiers chiffres)
-- Le SIREN est composé des 9 premiers chiffres du SIRET (14 chiffres)
DO $$
BEGIN
  UPDATE "Cabinet"
  SET siren = REGEXP_REPLACE(SUBSTRING(siret FROM 1 FOR 9), '[^0-9]', '', 'g')
  WHERE siret IS NOT NULL 
    AND siren IS NULL
    AND LENGTH(REGEXP_REPLACE(siret, '[^0-9]', '', 'g')) >= 9;
  
  RAISE NOTICE '✅ Migration des données SIREN depuis SIRET effectuée';
END $$;

COMMENT ON COLUMN "Cabinet".siren IS 'SIREN du cabinet (9 chiffres) - utilisé pour préremplir le formulaire d''ajout de collaborateur';

COMMIT;

