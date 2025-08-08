-- Script d'analyse de la table Audit et ses références
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table Audit existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'Audit' 
    AND table_schema = 'public';

-- 2. Vérifier la structure de la table Audit
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Audit' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes de clé étrangère qui référencent la table Audit
SELECT 
    tc.constraint_name,
    tc.table_name,
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
    AND ccu.table_name = 'Audit'
    AND tc.table_schema = 'public';

-- 4. Vérifier les contraintes de clé étrangère définies dans la table Audit
SELECT 
    tc.constraint_name,
    tc.table_name,
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
    AND tc.table_name = 'Audit'
    AND tc.table_schema = 'public';

-- 5. Compter le nombre d'enregistrements dans la table Audit
SELECT COUNT(*) as nombre_audits FROM "Audit";

-- 6. Vérifier les triggers associés à la table Audit
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'Audit'
    AND trigger_schema = 'public';

-- 7. Vérifier les vues qui utilisent la table Audit
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%Audit%'
    AND table_schema = 'public';

-- 8. Lister toutes les tables pour vérifier les références potentielles
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;
