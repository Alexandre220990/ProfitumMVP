-- ============================================================================
-- MIGRATION : AJOUT DE LA COLONNE hourly_rate À LA TABLE Expert
-- ============================================================================
-- Date: 2025-01-27
-- Objectif: Ajouter la colonne hourly_rate (optionnel, NULL accepté) pour 
--           permettre aux experts de définir leur taux horaire
-- ============================================================================

-- Ajouter la colonne hourly_rate si elle n'existe pas
ALTER TABLE "Expert" 
ADD COLUMN IF NOT EXISTS "hourly_rate" DOUBLE PRECISION NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN "Expert"."hourly_rate" IS 'Taux horaire de l''expert en euros (optionnel, NULL accepté)';

-- Vérification de l'ajout
SELECT 
    'VERIFICATION hourly_rate' as verification,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Expert'
  AND column_name = 'hourly_rate';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

