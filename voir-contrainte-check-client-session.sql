-- =====================================================
-- VOIR CONTRAINTE CHECK_CLIENT_OR_SESSION
-- =====================================================

-- Afficher la définition de la contrainte
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'check_client_or_session'
  AND conrelid = '"ClientProduitEligible"'::regclass;

-- Afficher toutes les contraintes CHECK sur la table
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = '"ClientProduitEligible"'::regclass
  AND contype = 'c'
ORDER BY conname;

