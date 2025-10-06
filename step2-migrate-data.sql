-- ============================================================================
-- ÉTAPE 2: MIGRATION DES DONNÉES - ProduitEligible
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Migrer les données des colonnes dupliquées vers les colonnes principales

-- ÉTAPE 2A: Vérifier les différences entre les colonnes dupliquées
SELECT '=== VÉRIFICATION DES DIFFÉRENCES ===' as step;

SELECT 
    nom,
    categorie,
    category,
    CASE 
        WHEN categorie = category THEN 'IDENTIQUES'
        WHEN categorie IS NULL AND category IS NOT NULL THEN 'category a une valeur, categorie est NULL'
        WHEN categorie IS NOT NULL AND category IS NULL THEN 'categorie a une valeur, category est NULL'
        WHEN categorie != category THEN 'DIFFÉRENTES'
        ELSE 'AUTRE'
    END as comparison_categorie,
    duree_max,
    "dureeMax",
    CASE 
        WHEN duree_max = "dureeMax" THEN 'IDENTIQUES'
        WHEN duree_max IS NULL AND "dureeMax" IS NOT NULL THEN 'dureeMax a une valeur, duree_max est NULL'
        WHEN duree_max IS NOT NULL AND "dureeMax" IS NULL THEN 'duree_max a une valeur, dureeMax est NULL'
        WHEN duree_max != "dureeMax" THEN 'DIFFÉRENTES'
        ELSE 'AUTRE'
    END as comparison_duree
FROM "ProduitEligible"
WHERE categorie != category OR duree_max != "dureeMax"
OR (categorie IS NULL AND category IS NOT NULL)
OR (duree_max IS NULL AND "dureeMax" IS NOT NULL);

-- ÉTAPE 2B: Migrer les données si nécessaire
SELECT '=== MIGRATION DES DONNÉES ===' as step;

-- Migrer category vers categorie si nécessaire
UPDATE "ProduitEligible" 
SET categorie = category 
WHERE categorie IS NULL AND category IS NOT NULL;

-- Migrer dureeMax vers duree_max si nécessaire
UPDATE "ProduitEligible" 
SET duree_max = "dureeMax" 
WHERE duree_max IS NULL AND "dureeMax" IS NOT NULL;

-- ÉTAPE 2C: Vérifier après migration
SELECT '=== VÉRIFICATION APRÈS MIGRATION ===' as step;

SELECT 
    COUNT(*) as total_produits,
    COUNT(CASE WHEN categorie IS NOT NULL THEN 1 END) as avec_categorie,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree_max
FROM "ProduitEligible";

-- ÉTAPE 2D: Vérifier qu'il n'y a plus de différences
SELECT '=== VÉRIFICATION FINALE DES DIFFÉRENCES ===' as step;

SELECT 
    COUNT(*) as produits_avec_differences
FROM "ProduitEligible"
WHERE categorie != category OR duree_max != "dureeMax"
OR (categorie IS NULL AND category IS NOT NULL)
OR (duree_max IS NULL AND "dureeMax" IS NOT NULL);

-- Si le résultat est 0, on peut procéder à la suppression des colonnes dupliquées
