-- ============================================================================
-- MIGRATION DES CATÉGORIES DE PRODUITS
-- Date: 2025-01-XX
-- Objectif: Réorganiser les produits selon les grandes catégories métier
-- ============================================================================

-- ============================================================================
-- NOUVELLES GRANDES CATÉGORIES
-- ============================================================================
-- 1. Optimisation Fiscale
-- 2. Optimisation Sociale
-- 3. Optimisation Énergétique
-- 4. Services Juridiques et Recouvrement
-- 5. Logiciels et Outils Numériques
-- 6. Services Additionnels et Équipements (catégorie réservée pour futurs produits)

-- ============================================================================
-- MISE À JOUR DES CATÉGORIES EXISTANTES
-- ============================================================================

-- OPTIMISATION FISCALE
UPDATE "ProduitEligible"
SET "categorie" = 'Optimisation Fiscale'
WHERE "nom" IN ('FONCIER', 'TVA');

-- OPTIMISATION SOCIALE
-- DFS concerne les fiches de paie des employés (déduction forfaitaire spécifique)
UPDATE "ProduitEligible"
SET "categorie" = 'Optimisation Sociale'
WHERE "nom" IN ('DFS', 'MSA', 'URSSAF');

-- OPTIMISATION ÉNERGÉTIQUE
-- Note: "Optimisation Énergie" a été remplacé par "Optimisation fournisseur électricité" et "Optimisation fournisseur gaz"
UPDATE "ProduitEligible"
SET "categorie" = 'Optimisation Énergétique'
WHERE "nom" IN (
    'CEE',
    'Optimisation fournisseur électricité',
    'Optimisation fournisseur gaz',
    'TICPE'
);

-- SERVICES JURIDIQUES ET RECOUVREMENT
UPDATE "ProduitEligible"
SET "categorie" = 'Services Juridiques et Recouvrement'
WHERE "nom" = 'Recouvrement';

-- LOGICIELS ET OUTILS NUMÉRIQUES
UPDATE "ProduitEligible"
SET "categorie" = 'Logiciels et Outils Numériques'
WHERE "nom" IN ('Logiciel Solid', 'Chronotachygraphes digitaux');

-- ============================================================================
-- VÉRIFICATION DES MISE À JOUR
-- ============================================================================

-- Vérifier la répartition par catégorie
SELECT 
    "categorie",
    COUNT(*) as nombre_produits,
    STRING_AGG("nom", ', ' ORDER BY "nom") as produits
FROM "ProduitEligible"
GROUP BY "categorie"
ORDER BY "categorie";

-- Vérifier qu'il n'y a plus de produits sans catégorie
SELECT 
    id,
    nom,
    "categorie"
FROM "ProduitEligible"
WHERE "categorie" IS NULL OR "categorie" = '';

-- ============================================================================
-- ORDRE D'AFFICHAGE RECOMMANDÉ (pour référence future)
-- ============================================================================
-- L'ordre d'affichage peut être géré via une colonne "ordre_affichage" 
-- ou via un tri dans l'application
-- 
-- Ordre suggéré :
-- 1. Optimisation Fiscale
-- 2. Optimisation Sociale
-- 3. Optimisation Énergétique
-- 4. Services Juridiques et Recouvrement
-- 5. Logiciels et Outils Numériques (contient : Logiciel Solid, Chronotachygraphes digitaux)
-- 6. Services Additionnels et Équipements (catégorie réservée pour futurs produits)

