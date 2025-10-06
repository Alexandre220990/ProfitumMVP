-- ============================================================================
-- NETTOYAGE DES COLONNES DUPLIQUÉES - ProduitEligible
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Supprimer les colonnes dupliquées pour éviter la confusion

-- ÉTAPE 1: Vérifier les données avant suppression
SELECT '=== VÉRIFICATION AVANT NETTOYAGE ===' as step;

-- Vérifier s'il y a des différences entre les colonnes dupliquées
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

-- ÉTAPE 2: Migrer les données si nécessaire
-- (Exécuter seulement si des différences sont détectées)

-- Migrer category vers categorie si nécessaire
UPDATE "ProduitEligible" 
SET categorie = category 
WHERE categorie IS NULL AND category IS NOT NULL;

-- Migrer dureeMax vers duree_max si nécessaire
UPDATE "ProduitEligible" 
SET duree_max = "dureeMax" 
WHERE duree_max IS NULL AND "dureeMax" IS NOT NULL;

-- ÉTAPE 3: Vérifier après migration
SELECT '=== VÉRIFICATION APRÈS MIGRATION ===' as step;

SELECT 
    COUNT(*) as total_produits,
    COUNT(CASE WHEN categorie IS NOT NULL THEN 1 END) as avec_categorie,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree_max
FROM "ProduitEligible";

-- ÉTAPE 4: Supprimer les colonnes dupliquées
-- ATTENTION: Sauvegarder avant d'exécuter !

-- Supprimer la colonne 'category' (garder 'categorie')
-- ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS category;

-- Supprimer la colonne 'dureeMax' (garder 'duree_max')
-- ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS "dureeMax";

-- ÉTAPE 5: Vérification finale
SELECT '=== VÉRIFICATION FINALE ===' as step;

-- Vérifier que les colonnes dupliquées sont supprimées
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'category', 'duree_max', 'dureeMax')
ORDER BY column_name;

-- Statistiques finales
SELECT 
    COUNT(*) as total_produits,
    COUNT(DISTINCT categorie) as categories_uniques,
    COUNT(CASE WHEN montant_min IS NOT NULL THEN 1 END) as avec_montants,
    COUNT(CASE WHEN taux_min IS NOT NULL THEN 1 END) as avec_taux,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree
FROM "ProduitEligible";
