-- Script pour vérifier les politiques RLS et permissions
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si RLS est activé sur ClientProduitEligible
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public';

-- 2. Lister toutes les politiques RLS sur ClientProduitEligible
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

-- 3. Vérifier les permissions de l'utilisateur anon
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'ClientProduitEligible'
AND table_schema = 'public'
AND grantee IN ('anon', 'authenticated', 'service_role');

-- 4. Vérifier les permissions de l'utilisateur authenticated
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'ClientProduitEligible'
AND table_schema = 'public'
AND grantee = 'authenticated';

-- 5. Vérifier les permissions de service_role
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'ClientProduitEligible'
AND table_schema = 'public'
AND grantee = 'service_role';

-- 6. Vérifier les permissions sur les colonnes
SELECT 
    grantee,
    table_name,
    column_name,
    privilege_type,
    is_grantable
FROM information_schema.role_column_grants 
WHERE table_name = 'ClientProduitEligible'
AND table_schema = 'public'
AND grantee IN ('anon', 'authenticated', 'service_role');

-- 7. Tester l'insertion avec différents rôles
-- Note: Ces requêtes doivent être exécutées avec les bons rôles

-- Test avec service_role (devrait fonctionner)
-- SET ROLE service_role;
-- INSERT INTO "ClientProduitEligible" (id, "clientId", "produitId", statut, "tauxFinal", "montantFinal", "dureeFinale", "created_at", "updated_at")
-- VALUES (gen_random_uuid(), 'test-client-id', '32dd9cf8-15e2-4375-86ab-a95158d3ada1', 'eligible', 0.75, 4388, 12, NOW(), NOW());

-- 8. Vérifier les triggers qui pourraient bloquer l'insertion
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'ClientProduitEligible'
AND event_object_schema = 'public';

-- 9. Vérifier les fonctions utilisées dans les triggers
SELECT 
    t.trigger_name,
    t.action_statement,
    p.prosrc
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = (
    SELECT regexp_replace(
        t.action_statement, 
        '^EXECUTE FUNCTION ([^(]+).*$', 
        '\1'
    )
)
WHERE t.event_object_table = 'ClientProduitEligible'
AND t.event_object_schema = 'public';

-- 10. Vérifier les contraintes de clés étrangères
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