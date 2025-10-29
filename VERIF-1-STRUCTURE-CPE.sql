-- ============================================================================
-- VÉRIFICATION 1 : Structure exacte de ClientProduitEligible
-- ============================================================================

-- Lister TOUTES les colonnes de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

