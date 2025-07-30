-- Script d'analyse complète des structures de tables pour la migration
-- Date: 2025-01-27
-- Objectif: Vérifier la compatibilité entre tables temporaires et finales

-- =====================================================
-- 1. ANALYSE DE LA TABLE CLIENT
-- =====================================================

SELECT 
    'CLIENT' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Client'
ORDER BY ordinal_position;

-- =====================================================
-- 2. ANALYSE DE LA TABLE PRODUITELIGIBLE
-- =====================================================

SELECT 
    'PRODUITELIGIBLE' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- =====================================================
-- 3. ANALYSE DE LA TABLE CLIENTPRODUITELIGIBLE
-- =====================================================

SELECT 
    'CLIENTPRODUITELIGIBLE' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- =====================================================
-- 4. ANALYSE DES TABLES TEMPORAIRES (SI ELLES EXISTENT)
-- =====================================================

-- Vérifier si les tables temporaires existent
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'TemporarySession',
        'TemporaryEligibility', 
        'TemporaryResponse',
        'SimulatorAnalytics'
    );

-- Si elles existent, analyser leur structure
DO $$
DECLARE
    temp_table text;
BEGIN
    FOR temp_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
            AND table_name IN (
                'TemporarySession',
                'TemporaryEligibility', 
                'TemporaryResponse',
                'SimulatorAnalytics'
            )
    LOOP
        RAISE NOTICE 'Analyse de la table temporaire: %', temp_table;
        
        -- Exécuter l'analyse pour chaque table temporaire
        EXECUTE format('
            SELECT 
                %L as table_name,
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                ordinal_position
            FROM information_schema.columns 
            WHERE table_schema = ''public'' 
                AND table_name = %L
            ORDER BY ordinal_position;
        ', temp_table, temp_table);
    END LOOP;
END $$;

-- =====================================================
-- 5. VÉRIFICATION DES CONTRAINTES ET RELATIONS
-- =====================================================

-- Contraintes de clés étrangères pour ClientProduitEligible
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
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'ClientProduitEligible'
ORDER BY tc.constraint_type, kcu.column_name;

-- =====================================================
-- 6. VÉRIFICATION DES INDEX
-- =====================================================

-- Index sur ClientProduitEligible
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
    AND tablename = 'ClientProduitEligible'
ORDER BY indexname;

-- =====================================================
-- 7. VÉRIFICATION DES POLITIQUES RLS
-- =====================================================

-- Politiques RLS sur ClientProduitEligible
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'ClientProduitEligible'
ORDER BY policyname;

-- =====================================================
-- 8. VÉRIFICATION DES DONNÉES EXISTANTES
-- =====================================================

-- Compter les enregistrements dans chaque table
SELECT 'Client' as table_name, COUNT(*) as record_count FROM "Client"
UNION ALL
SELECT 'ProduitEligible', COUNT(*) FROM "ProduitEligible"
UNION ALL
SELECT 'ClientProduitEligible', COUNT(*) FROM "ClientProduitEligible";

-- Vérifier les données de test
SELECT 
    'Client de test' as type,
    COUNT(*) as count
FROM "Client"
WHERE email LIKE '%test%' OR email LIKE '%migration%'
UNION ALL
SELECT 
    'ClientProduitEligible de test',
    COUNT(*)
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
WHERE c.email LIKE '%test%' OR c.email LIKE '%migration%';

-- =====================================================
-- 9. VÉRIFICATION DES TYPES DE DONNÉES CRITIQUES
-- =====================================================

-- Vérifier les types UUID
SELECT 
    'UUID columns' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('Client', 'ProduitEligible', 'ClientProduitEligible')
    AND data_type = 'uuid'
ORDER BY table_name, column_name;

-- Vérifier les colonnes JSONB
SELECT 
    'JSONB columns' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('Client', 'ProduitEligible', 'ClientProduitEligible')
    AND data_type = 'jsonb'
ORDER BY table_name, column_name; 