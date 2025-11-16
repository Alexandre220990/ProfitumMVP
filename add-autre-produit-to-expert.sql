-- ============================================================================
-- Script : Ajouter la colonne autre_produit à la table Expert
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Permettre de stocker un texte libre pour les produits non listés
--           dans le catalogue ProduitEligible
-- ============================================================================

BEGIN;

-- Ajouter la colonne autre_produit (texte libre)
ALTER TABLE "Expert" 
ADD COLUMN IF NOT EXISTS autre_produit TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN "Expert".autre_produit IS 'Texte libre pour décrire un produit non listé dans le catalogue ProduitEligible. Visible par l''admin lors de la validation.';

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Expert'
  AND column_name = 'autre_produit';

