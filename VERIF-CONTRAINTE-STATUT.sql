-- ============================================================================
-- VÉRIFIER LA CONTRAINTE CHECK SUR statut
-- ============================================================================

-- Voir la définition de la contrainte
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = '"ClientProduitEligible"'::regclass
  AND conname LIKE '%statut%';

-- Voir toutes les contraintes sur la table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = '"ClientProduitEligible"'::regclass
ORDER BY conname;

