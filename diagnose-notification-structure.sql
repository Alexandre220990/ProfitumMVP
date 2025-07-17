-- Script de diagnostic pour les tables notification
-- Date: 2025-01-03

-- =====================================================
-- ÉTAPE 1: VÉRIFICATION DES TABLES EXISTANTES
-- =====================================================

-- Vérifier si les tables existent
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('notification', 'Notification')
ORDER BY table_name;

-- =====================================================
-- ÉTAPE 2: STRUCTURE DE LA TABLE notification (minuscule)
-- =====================================================

-- Vérifier la structure de la table notification (minuscule)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'notification'
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 3: STRUCTURE DE LA TABLE Notification (majuscule)
-- =====================================================

-- Vérifier la structure de la table Notification (majuscule)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'Notification'
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 4: COMPTER LES DONNÉES
-- =====================================================

-- Compter les données dans chaque table
SELECT 'notification (minuscule)' as table_name, COUNT(*) as row_count FROM notification
UNION ALL
SELECT 'Notification (majuscule)' as table_name, COUNT(*) as row_count FROM "Notification";

-- =====================================================
-- ÉTAPE 5: ÉCHANTILLON DE DONNÉES
-- =====================================================

-- Voir un échantillon de la table notification (minuscule)
SELECT * FROM notification LIMIT 3;

-- Voir un échantillon de la table Notification (majuscule)
SELECT * FROM "Notification" LIMIT 3;

-- =====================================================
-- ÉTAPE 6: VÉRIFIER LES POLITIQUES RLS
-- =====================================================

-- Politiques pour notification (minuscule)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notification';

-- Politiques pour Notification (majuscule)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'Notification'; 