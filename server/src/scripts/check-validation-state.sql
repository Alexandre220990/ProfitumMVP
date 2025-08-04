-- Script de vérification pour ValidationState
-- Version sécurisée qui vérifie d'abord la structure

-- 1. Vérifier la structure actuelle
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ValidationState' 
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes existantes
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'ValidationState';

-- 3. Vérifier les index existants
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ValidationState';

-- 4. Compter les enregistrements
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN simulation_id IS NOT NULL THEN 1 END) as with_simulation_id,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as with_client_id,
    COUNT(CASE WHEN phase IS NOT NULL THEN 1 END) as with_phase
FROM "ValidationState";

-- 5. Vérifier les phases uniques
SELECT 
    phase,
    COUNT(*) as count
FROM "ValidationState" 
GROUP BY phase 
ORDER BY count DESC; 