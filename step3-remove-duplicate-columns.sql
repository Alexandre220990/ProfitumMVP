-- ============================================================================
-- ÉTAPE 3: SUPPRESSION DES COLONNES DUPLIQUÉES - ProduitEligible
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Supprimer les colonnes dupliquées maintenant que les données sont migrées

-- ÉTAPE 3A: Vérification finale avant suppression
SELECT '=== VÉRIFICATION FINALE AVANT SUPPRESSION ===' as step;

-- Vérifier qu'il n'y a plus de différences
SELECT 
    COUNT(*) as produits_avec_differences
FROM "ProduitEligible"
WHERE categorie != category OR duree_max != "dureeMax"
OR (categorie IS NULL AND category IS NOT NULL)
OR (duree_max IS NULL AND "dureeMax" IS NOT NULL);

-- Si le résultat est 0, on peut procéder à la suppression

-- ÉTAPE 3B: Supprimer les colonnes dupliquées
SELECT '=== SUPPRESSION DES COLONNES DUPLIQUÉES ===' as step;

-- Supprimer la colonne 'category' (garder 'categorie')
ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS category;

-- Supprimer la colonne 'dureeMax' (garder 'duree_max')
ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS "dureeMax";

-- ÉTAPE 3C: Vérification après suppression
SELECT '=== VÉRIFICATION APRÈS SUPPRESSION ===' as step;

-- Vérifier que les colonnes dupliquées sont supprimées
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'category', 'duree_max', 'dureeMax')
ORDER BY column_name;

-- ÉTAPE 3D: Statistiques finales
SELECT '=== STATISTIQUES FINALES ===' as step;

SELECT 
    COUNT(*) as total_produits,
    COUNT(DISTINCT categorie) as categories_uniques,
    COUNT(CASE WHEN montant_min IS NOT NULL THEN 1 END) as avec_montants,
    COUNT(CASE WHEN taux_min IS NOT NULL THEN 1 END) as avec_taux,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree
FROM "ProduitEligible";

-- ÉTAPE 3E: Liste des colonnes restantes
SELECT '=== COLONNES RESTANTES ===' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
ORDER BY ordinal_position;
