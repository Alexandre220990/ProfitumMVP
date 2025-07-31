-- Script de test pour vérifier l'existence des tables
-- À exécuter pour diagnostiquer les problèmes d'accès aux tables

-- 1. Vérifier l'existence des tables principales
SELECT 'VÉRIFICATION EXISTENCE TABLES' as info;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('Client', 'Expert', 'Admin', 'ClientProduitEligible')
ORDER BY tablename;

-- 2. Vérifier les permissions sur les tables
SELECT 'VÉRIFICATION PERMISSIONS' as info;

SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('Client', 'Expert', 'Admin', 'ClientProduitEligible')
ORDER BY table_name, privilege_type;

-- 3. Test simple de sélection sur chaque table
SELECT 'TEST SÉLECTION CLIENT' as info;

SELECT COUNT(*) as client_count FROM "Client";

SELECT 'TEST SÉLECTION EXPERT' as info;

SELECT COUNT(*) as expert_count FROM "Expert";

SELECT 'TEST SÉLECTION ADMIN' as info;

SELECT COUNT(*) as admin_count FROM "Admin";

SELECT 'TEST SÉLECTION CLIENTPRODUITELIGIBLE' as info;

SELECT COUNT(*) as clientproduit_count FROM "ClientProduitEligible";

-- 4. Vérifier les OID des tables
SELECT 'OID DES TABLES' as info;

SELECT 
    relname as table_name,
    oid as table_oid,
    reltuples as estimated_rows
FROM pg_class 
WHERE relkind = 'r' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND relname IN ('Client', 'Expert', 'Admin', 'ClientProduitEligible')
ORDER BY relname; 