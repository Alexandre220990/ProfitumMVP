-- Script d'analyse détaillée de la table ClientProduitEligible
-- À exécuter dans Supabase SQL Editor

-- 1. Structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 2. Contraintes de validation (CHECK constraints)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'ClientProduitEligible'
AND tc.constraint_type = 'CHECK';

-- 3. Clés étrangères
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'ClientProduitEligible'
AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public';

-- 5. Politiques RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public';

-- 6. RLS activé ou non
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public';

-- 7. Exemple de données existantes (si il y en a)
SELECT 
    id,
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    "created_at",
    "updated_at"
FROM "ClientProduitEligible"
LIMIT 5;

-- 8. Vérifier les contraintes de nommage
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible';

-- 9. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'ClientProduitEligible'
AND event_object_schema = 'public'; 