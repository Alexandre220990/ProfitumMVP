-- Script pour afficher la structure complète de la table Client
-- Usage: psql -d votre_base -f show-client-table-structure.sql

-- 1. Afficher la structure de la table Client
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Afficher les contraintes de la table Client
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'Client'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Afficher les index de la table Client
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Client'
AND schemaname = 'public'
ORDER BY indexname;

-- 4. Afficher un exemple de données de la table Client
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
        WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
        ELSE data_type
    END as formatted_type
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Afficher le nombre total de colonnes
SELECT 
    COUNT(*) as total_columns,
    'Client' as table_name
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND table_schema = 'public';

-- 6. Afficher les colonnes avec leurs commentaires (si disponibles)
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    pgd.description as column_comment
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st 
    ON c.table_name = st.relname
LEFT JOIN pg_catalog.pg_description pgd 
    ON (pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position)
WHERE c.table_name = 'Client'
AND c.table_schema = 'public'
ORDER BY c.ordinal_position; 