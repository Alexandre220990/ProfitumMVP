-- Vérifier les contraintes sur GEDDocument
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = '"GEDDocument"'::regclass
  AND contype = 'c'; -- CHECK constraints

