-- =====================================================
-- VÉRIFICATION DES TABLES EXISTANTES
-- Date: 2025-01-30
-- =====================================================

-- 1. Lister toutes les tables du schéma public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Chercher spécifiquement les tables liées au simulateur
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%temp%' OR
    table_name ILIKE '%session%' OR
    table_name ILIKE '%simulator%' OR
    table_name ILIKE '%questionnaire%' OR
    table_name ILIKE '%eligibility%'
)
ORDER BY table_name;

-- 3. Vérifier les tables avec des noms similaires
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%session%'
ORDER BY table_name;

-- 4. Vérifier les tables avec des noms similaires pour les réponses
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%response%'
ORDER BY table_name;

-- 5. Vérifier les tables avec des noms similaires pour l'éligibilité
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%eligibility%'
ORDER BY table_name; 