-- Vérifier la structure exacte de ClientProduitEligible
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

