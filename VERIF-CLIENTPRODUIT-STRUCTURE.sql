-- ============================================================================
-- VÉRIFICATION STRUCTURE ClientProduitEligible
-- ============================================================================

-- 1. STRUCTURE ACTUELLE DE ClientProduitEligible
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 2. CONTRAINTES ET CLÉs ÉTRANGÈRES
-- ============================================================================
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'ClientProduitEligible'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. ÉCHANTILLON DE DONNÉES (3 derniers)
-- ============================================================================
SELECT 
  id,
  "clientId",
  "produitId",
  statut,
  "tauxFinal",
  "montantFinal",
  "dureeFinale",
  "simulationId",
  metadata,
  notes,
  created_at
FROM "ClientProduitEligible"
ORDER BY created_at DESC
LIMIT 3;

-- 4. VÉRIFIER SI COLONNES METADATA ET NOTES EXISTENT
-- ============================================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProduitEligible' 
      AND column_name = 'metadata'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_metadata_existe,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProduitEligible' 
      AND column_name = 'notes'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_notes_existe,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProduitEligible' 
      AND column_name = 'calcul_details'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_calcul_details_existe;

