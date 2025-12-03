-- ============================================================================
-- MIGRATION : Ajout colonne secteurs_activite à ProduitEligible
-- Date: 2025-12-03
-- Objectif: Permettre la sélection de secteurs d'activité spécifiques par produit
-- ============================================================================

-- Ajouter la colonne secteurs_activite (array de texte, nullable)
-- NULL = tous les secteurs sont concernés
-- [] ou array vide = aucun secteur (produit désactivé pour tous)
-- ['Transport', 'Commerce'] = secteurs spécifiques

ALTER TABLE "ProduitEligible" 
ADD COLUMN IF NOT EXISTS secteurs_activite TEXT[] DEFAULT NULL;

COMMENT ON COLUMN "ProduitEligible".secteurs_activite IS 
'Secteurs d''activité concernés par le produit. NULL = tous secteurs. Array vide ou valeurs = secteurs spécifiques.';

-- Vérification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ProduitEligible'
AND column_name = 'secteurs_activite';

