-- ===== VÉRIFICATION STRUCTURE TABLE DOCUMENTFILE =====
-- Script pour vérifier les colonnes exactes de la table DocumentFile
-- Date: 2025-01-03

-- 1. Vérifier toutes les colonnes de DocumentFile
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'DocumentFile'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de clés étrangères
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name = 'DocumentFile'
ORDER BY kcu.column_name;

-- 3. Vérifier les index existants
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'DocumentFile'
AND schemaname = 'public';

-- 4. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'DocumentFile';

-- 5. Vérifier les politiques RLS existantes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'DocumentFile'
ORDER BY policyname; 