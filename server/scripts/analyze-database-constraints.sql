-- ============================================================================
-- ANALYSE DES CONTRAINTES ET INDEX - BASE DE DONNÉES FINANCIALTRACKER
-- ============================================================================
-- Date : 15 janvier 2025
-- Objectif : Analyser les contraintes FK, CHECK et index pour l'alignement

-- ============================================================================
-- REQUÊTE 1 : VÉRIFICATION DES CONTRAINTES FK
-- ============================================================================
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- REQUÊTE 2 : VÉRIFICATION DES CONTRAINTES CHECK
-- ============================================================================
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'c' 
    AND conrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- REQUÊTE 3 : VÉRIFICATION DES INDEX (DÉJÀ EXÉCUTÉE)
-- ============================================================================
-- Résultats obtenus et analysés dans le knowledge base

-- ============================================================================
-- REQUÊTE 4 : ANALYSE DES TABLES VIDES CRITIQUES
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    n_tup_ins as insertions,
    n_tup_upd as updates,
    n_tup_del as deletions,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'CalendarEventParticipant',
        'CalendarEventReminder', 
        'GEDDocumentVersion',
        'authenticated_users',
        'TICPERates',
        'TICPESectors',
        'TICPEVehicleTypes',
        'TICPEAdvancedRules'
    )
ORDER BY n_live_tup ASC;

-- ============================================================================
-- REQUÊTE 5 : VÉRIFICATION DES TRIGGERS
-- ============================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN (
        'CalendarEventParticipant',
        'CalendarEventReminder',
        'GEDDocumentVersion',
        'TICPERates',
        'TICPESectors',
        'TICPEVehicleTypes',
        'TICPEAdvancedRules'
    )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- REQUÊTE 6 : ANALYSE DES COLONNES AVEC MAJUSCULES
-- ============================================================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name = 'ClientProduitEligible'
    AND column_name IN ('clientId', 'produitId', 'montantFinal', 'simulationId', 'sessionId')
ORDER BY ordinal_position;
