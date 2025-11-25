-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 1B : CONTRAINTES ET INDEXES (CORRIGÉ)
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Compléter l'analyse des contraintes et index de la table Admin
--            (version corrigée pour éviter l'erreur de casse)
-- ============================================================================

-- ============================================================================
-- 1. CONTRAINTES DE LA TABLE ADMIN
-- ============================================================================

-- Contraintes (primary key, foreign keys, unique, check)
SELECT 
    'CONTRAINTES' as analyse_etape,
    conname as nom_contrainte,
    contype as type_contrainte,
    -- p = primary key, f = foreign key, u = unique, c = check
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
    END as type_contrainte_lisible,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'Admin' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
ORDER BY contype, conname;

-- ============================================================================
-- 2. INDEXES DE LA TABLE ADMIN
-- ============================================================================

-- Indexes
SELECT 
    'INDEXES' as analyse_etape,
    indexname as nom_index,
    indexdef as definition_index
FROM pg_indexes
WHERE tablename = 'Admin'
  AND schemaname = 'public'
ORDER BY indexname;

-- Indexes détaillés avec colonnes
SELECT 
    'INDEXES DETAILLES' as analyse_etape,
    i.relname as nom_index,
    a.attname as colonne_indexee,
    am.amname as type_index,
    idx.indisunique as est_unique,
    idx.indisprimary as est_primary_key
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_am am ON i.relam = am.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
WHERE t.relname = 'Admin'
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY i.relname, a.attnum;

-- ============================================================================
-- 3. VÉRIFICATION DES COLONNES REDONDANTES (auth_id vs auth_user_id)
-- ============================================================================

-- Vérifier les valeurs dans auth_id et auth_user_id
SELECT 
    'VERIFICATION COLONNES REDONDANTES' as analyse_etape,
    id,
    email,
    name,
    auth_id,
    auth_user_id,
    CASE 
        WHEN auth_id IS NULL AND auth_user_id IS NOT NULL THEN '✅ Utilise auth_user_id'
        WHEN auth_id IS NOT NULL AND auth_user_id IS NULL THEN '⚠️ Utilise auth_id (ancien)'
        WHEN auth_id = auth_user_id THEN '✅ Valeurs identiques'
        WHEN auth_id IS NOT NULL AND auth_user_id IS NOT NULL AND auth_id != auth_user_id THEN '❌ Valeurs différentes'
        ELSE '⚠️ Les deux sont NULL'
    END as statut_colonnes
FROM "Admin"
ORDER BY created_at DESC;

-- ============================================================================
-- 4. VÉRIFICATION DES CONTRAINTES UNIQUES SUR EMAIL
-- ============================================================================

-- Vérifier s'il existe une contrainte unique sur email (important pour éviter les doublons)
SELECT 
    'CONTRAINTE UNIQUE EMAIL' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
            WHERE t.relname = 'Admin'
            AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND c.contype = 'u'
            AND a.attname = 'email'
        ) THEN '✅ Contrainte UNIQUE sur email existe'
        ELSE '⚠️ Pas de contrainte UNIQUE sur email (risque de doublons)'
    END as statut;

-- ============================================================================
-- 5. VÉRIFICATION DES CONTRAINTES UNIQUES SUR auth_user_id
-- ============================================================================

-- Vérifier s'il existe une contrainte unique sur auth_user_id
SELECT 
    'CONTRAINTE UNIQUE auth_user_id' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
            WHERE t.relname = 'Admin'
            AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND c.contype = 'u'
            AND a.attname = 'auth_user_id'
        ) THEN '✅ Contrainte UNIQUE sur auth_user_id existe'
        ELSE '⚠️ Pas de contrainte UNIQUE sur auth_user_id (un auth_user_id pourrait être lié à plusieurs admins)'
    END as statut;

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Ce script complète l'analyse de l'étape 1 en vérifiant :
-- 1. Toutes les contraintes (PK, FK, UNIQUE, CHECK)
-- 2. Tous les index pour optimiser les requêtes
-- 3. Les colonnes redondantes (auth_id vs auth_user_id)
-- 4. Les contraintes d'unicité sur email et auth_user_id
-- 
-- Prochaine étape : Analyser les RLS policies (étape 2)

