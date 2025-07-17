-- Script SQL pour analyser complètement le schéma de la base de données
-- À exécuter dans l'interface SQL de Supabase
-- Date: 2025-01-03

-- =====================================================
-- 1. RÉCUPÉRATION DE TOUTES LES TABLES
-- =====================================================

-- Liste de toutes les tables avec leurs informations de base
SELECT 
    t.table_name,
    t.table_type,
    c.reltuples::bigint AS estimated_rows,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS table_size
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- =====================================================
-- 2. ANALYSE DÉTAILLÉE DE CHAQUE TABLE
-- =====================================================

-- Colonnes de toutes les tables avec leurs types et contraintes
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE 'NORMAL'
    END AS constraint_type,
    fk.referenced_table_name,
    fk.referenced_column_name
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.column_name AS referenced_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON t.table_name = fk.table_name AND c.column_name = fk.column_name
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON t.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- 3. INDEX ET CONTRAINTES
-- =====================================================

-- Index de toutes les tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Contraintes de toutes les tables
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- =====================================================
-- 4. STATISTIQUES DES TABLES
-- =====================================================

-- Nombre de lignes par table
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 5. ANALYSE SPÉCIFIQUE PAR TABLE
-- =====================================================

-- Pour chaque table importante, voici les requêtes spécifiques :

-- === TABLE: Client ===
SELECT 'Client' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Client'
ORDER BY ordinal_position;

-- === TABLE: Expert ===
SELECT 'Expert' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Expert'
ORDER BY ordinal_position;

-- === TABLE: ProduitEligible ===
SELECT 'ProduitEligible' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- === TABLE: ClientProduitEligible ===
SELECT 'ClientProduitEligible' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- === TABLE: message ===
SELECT 'message' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'message'
ORDER BY ordinal_position;

-- === TABLE: ExpertAssignment ===
SELECT 'ExpertAssignment' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ExpertAssignment'
ORDER BY ordinal_position;

-- === TABLE: ExpertNotifications ===
SELECT 'ExpertNotifications' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ExpertNotifications'
ORDER BY ordinal_position;

-- === TABLE: ChartesProduits ===
SELECT 'ChartesProduits' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ChartesProduits'
ORDER BY ordinal_position;

-- =====================================================
-- 6. VÉRIFICATION DES RELATIONS
-- =====================================================

-- Relations entre les tables (clés étrangères)
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 7. VÉRIFICATION DES POLITIQUES RLS
-- =====================================================

-- Politiques RLS actives
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 8. VÉRIFICATION DES TRIGGERS
-- =====================================================

-- Triggers actifs
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 9. RÉSUMÉ GLOBAL
-- =====================================================

-- Résumé des tables et leurs caractéristiques
WITH table_stats AS (
    SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count,
        COUNT(CASE WHEN c.column_name IN ('created_at', 'updated_at', 'timestamp') THEN 1 END) as has_timestamps,
        COUNT(CASE WHEN c.column_name IN ('deleted_at', 'is_deleted', 'active') THEN 1 END) as has_soft_delete,
        COUNT(CASE WHEN pk.column_name IS NOT NULL THEN 1 END) as primary_keys,
        COUNT(CASE WHEN fk.column_name IS NOT NULL THEN 1 END) as foreign_keys
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
    LEFT JOIN (
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
    ) pk ON t.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    ) fk ON t.table_name = fk.table_name AND c.column_name = fk.column_name
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    GROUP BY t.table_name
)
SELECT 
    table_name,
    column_count,
    CASE WHEN has_timestamps > 0 THEN '✅' ELSE '❌' END as timestamps,
    CASE WHEN has_soft_delete > 0 THEN '✅' ELSE '❌' END as soft_delete,
    primary_keys,
    foreign_keys
FROM table_stats
ORDER BY table_name;

-- =====================================================
-- 10. VÉRIFICATION DES DONNÉES
-- =====================================================

-- Nombre de lignes par table (approximatif)
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
INSTRUCTIONS POUR UTILISER CE SCRIPT :

1. Ouvrez l'interface SQL de Supabase
2. Copiez-collez ce script complet
3. Exécutez-le section par section ou en entier
4. Sauvegardez les résultats dans un fichier texte
5. Envoyez-moi les résultats pour que je mette à jour la documentation

SECTIONS IMPORTANTES À EXÉCUTER :
- Section 1 : Vue d'ensemble des tables
- Section 2 : Détail des colonnes (le plus important)
- Section 5 : Analyse spécifique des tables principales
- Section 6 : Relations entre tables
- Section 9 : Résumé global

Une fois que vous m'aurez fourni ces informations, je pourrai :
✅ Mettre à jour la documentation complète de la base de données
✅ Identifier les tables obsolètes
✅ Optimiser les requêtes
✅ Créer les migrations manquantes
✅ Améliorer la structure si nécessaire
*/ 