-- Script pour vérifier la structure exacte des tables
-- À exécuter pour identifier les problèmes de casse dans les colonnes

-- 1. Structure de la table Client
SELECT 'STRUCTURE TABLE CLIENT' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Client'
ORDER BY ordinal_position;

-- 2. Structure de la table ClientProduitEligible
SELECT 'STRUCTURE TABLE CLIENTPRODUITELIGIBLE' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 3. Structure de la table Expert
SELECT 'STRUCTURE TABLE EXPERT' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Expert'
ORDER BY ordinal_position;

-- 4. Structure de la table Admin
SELECT 'STRUCTURE TABLE ADMIN' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Admin'
ORDER BY ordinal_position;

-- 5. Vérification des contraintes de clés étrangères
SELECT 'CONTRAINTES DE CLÉS ÉTRANGÈRES' as info;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('Client', 'ClientProduitEligible', 'Expert', 'Admin')
ORDER BY tc.table_name, kcu.column_name;

-- 6. Vérification des index
SELECT 'INDEX' as info;

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('Client', 'ClientProduitEligible', 'Expert', 'Admin')
ORDER BY tablename, indexname; 