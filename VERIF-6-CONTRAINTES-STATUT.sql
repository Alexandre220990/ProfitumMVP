-- ============================================================================
-- VÉRIFICATION 6 : Contraintes sur la colonne statut
-- ============================================================================

-- 1. VÉRIFIER LES CONTRAINTES DE CHECK SUR ClientProduitEligible
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public."ClientProduitEligible"'::regclass
  AND contype = 'c'; -- 'c' = check constraint

-- 2. VÉRIFIER LES VALEURS ACTUELLES DE STATUT UTILISÉES
SELECT DISTINCT statut, COUNT(*) as count
FROM "ClientProduitEligible"
GROUP BY statut
ORDER BY count DESC;

-- 3. VÉRIFIER S'IL Y A UN TYPE ENUM POUR STATUT
SELECT 
    n.nspname AS enum_schema,
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname ILIKE '%statut%' OR t.typname ILIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- 4. VÉRIFIER TOUTES LES CONTRAINTES DE LA TABLE
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'ClientProduitEligible'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

