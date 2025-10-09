-- ============================================================================
-- VÉRIFICATION DE LA MIGRATION ClientRDV_Produits
-- ============================================================================

-- 1. Vérifier que la table existe
SELECT 
    'ClientRDV_Produits' as table_name,
    COUNT(*) as nombre_lignes
FROM "ClientRDV_Produits";

-- 2. Afficher la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ClientRDV_Produits'
ORDER BY ordinal_position;

-- 3. Vérifier les index créés
SELECT 
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'ClientRDV_Produits'
ORDER BY indexname;

-- 4. Vérifier les contraintes (foreign keys, unique, etc.)
SELECT
    tc.constraint_name as nom_contrainte,
    tc.constraint_type as type_contrainte,
    kcu.column_name as colonne,
    ccu.table_name AS table_liee,
    ccu.column_name AS colonne_liee
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'ClientRDV_Produits'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 5. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'ClientRDV_Produits';

-- 6. Résumé final
SELECT 
    '✅ Migration réussie !' as statut,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ClientRDV_Produits') as colonnes_creees,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ClientRDV_Produits') as index_crees,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'ClientRDV_Produits') as contraintes_creees,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ClientRDV_Produits') as politiques_rls_creees;

