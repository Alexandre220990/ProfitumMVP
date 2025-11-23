-- ============================================================================
-- ANALYSE COMPLÈTE DE LA TABLE ProduitEligible
-- Date: 2025-01-XX
-- Objectif: Analyser la structure et les catégories pour organiser l'affichage
-- ============================================================================

-- ============================================================================
-- 1. STRUCTURE COMPLÈTE DE LA TABLE ProduitEligible
-- ============================================================================
SELECT 
    column_name AS "Colonne",
    data_type AS "Type",
    is_nullable AS "Nullable",
    column_default AS "Défaut",
    character_maximum_length AS "Longueur max"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. COMPTER LE NOMBRE TOTAL DE PRODUITS
-- ============================================================================
SELECT COUNT(*) as nombre_total_produits
FROM "ProduitEligible";

-- ============================================================================
-- 3. ANALYSER LES CATÉGORIES EXISTANTES
-- ============================================================================
SELECT 
    "categorie",
    COUNT(*) as nombre_produits,
    STRING_AGG("nom", ', ' ORDER BY "nom") as produits
FROM "ProduitEligible"
GROUP BY "categorie"
ORDER BY nombre_produits DESC, "categorie";

-- ============================================================================
-- 4. LISTER TOUS LES PRODUITS AVEC LEURS CATÉGORIES
-- ============================================================================
SELECT 
    id,
    nom,
    "categorie",
    description,
    "montant_min",
    "montant_max",
    "taux_min",
    "taux_max",
    "duree_min",
    "duree_max",
    created_at,
    updated_at
FROM "ProduitEligible"
ORDER BY "categorie" NULLS LAST, "nom";

-- ============================================================================
-- 5. PRODUITS SANS CATÉGORIE
-- ============================================================================
SELECT 
    id,
    nom,
    description
FROM "ProduitEligible"
WHERE "categorie" IS NULL OR "categorie" = '';

-- ============================================================================
-- 6. VÉRIFIER LES VALEURS UNIQUES DE CATÉGORIE
-- ============================================================================
SELECT DISTINCT "categorie"
FROM "ProduitEligible"
WHERE "categorie" IS NOT NULL AND "categorie" != ''
ORDER BY "categorie";

