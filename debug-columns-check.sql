-- ============================================================================
-- DEBUG - Vérification des Colonnes Restantes
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Déboguer pourquoi le script détecte encore des colonnes dupliquées

-- ÉTAPE 1: Vérifier toutes les colonnes de ProduitEligible
SELECT '=== TOUTES LES COLONNES ===' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- ÉTAPE 2: Vérifier spécifiquement les colonnes problématiques
SELECT '=== COLONNES PROBLÉMATIQUES ===' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'category', 'duree_max', 'dureeMax')
ORDER BY column_name;

-- ÉTAPE 3: Compter les colonnes problématiques
SELECT '=== COMPTAGE DES COLONNES PROBLÉMATIQUES ===' as step;

SELECT 
    COUNT(*) as total_problematiques,
    STRING_AGG(column_name, ', ') as colonnes_detectees
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'category', 'duree_max', 'dureeMax');

-- ÉTAPE 4: Vérifier s'il y a des colonnes avec des noms similaires
SELECT '=== COLONNES AVEC NOMS SIMILAIRES ===' as step;

SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND (
    column_name LIKE '%categorie%' OR 
    column_name LIKE '%category%' OR
    column_name LIKE '%duree%' OR
    column_name LIKE '%duration%'
)
ORDER BY column_name;

-- ÉTAPE 5: Vérifier les contraintes
SELECT '=== CONTRAINTES ===' as step;

SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'ProduitEligible'
AND ccu.column_name IN ('categorie', 'category', 'duree_max', 'dureeMax');

-- ÉTAPE 6: Vérifier les index
SELECT '=== INDEX ===' as step;

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ProduitEligible'
AND (
    indexdef LIKE '%categorie%' OR 
    indexdef LIKE '%category%' OR
    indexdef LIKE '%duree%'
);
