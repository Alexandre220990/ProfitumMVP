-- Script de diagnostic pour la table Notification
-- Date: 2025-01-03

-- 1. Vérifier si la table Notification existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'Notification' 
   OR table_name = 'notification';

-- 2. Vérifier la structure de la table Notification (si elle existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Notification' 
   OR table_name = 'notification'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'Notification' 
   OR table_name = 'notification';

-- 4. Vérifier les index
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Notification' 
   OR tablename = 'notification';

-- 5. Vérifier les politiques RLS
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
WHERE tablename = 'Notification' 
   OR tablename = 'notification'; 