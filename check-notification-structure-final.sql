-- Script de diagnostic pour vérifier la structure des tables Notification
-- Exécutez ce script pour voir les colonnes exactes de chaque table

-- Vérifier si les tables existent
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename ILIKE '%notification%'
ORDER BY tablename;

-- Vérifier la structure de la table "Notification" (avec majuscule)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Notification' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table "notification" (minuscule)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notification' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table "Notification_final" si elle existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Notification_final' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Compter les enregistrements dans chaque table
SELECT 
    'Notification (majuscule)' as table_name,
    COUNT(*) as record_count
FROM public."Notification"
UNION ALL
SELECT 
    'notification (minuscule)' as table_name,
    COUNT(*) as record_count
FROM public.notification
UNION ALL
SELECT 
    'Notification_final' as table_name,
    COUNT(*) as record_count
FROM public.Notification_final; 