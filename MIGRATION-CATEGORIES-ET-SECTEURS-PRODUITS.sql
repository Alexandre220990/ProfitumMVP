-- ============================================================================
-- MIGRATION DES CATÉGORIES ET SECTEURS D'ACTIVITÉ DES PRODUITS
-- Date: 2025-01-XX
-- Objectif: Réorganiser les produits selon les grandes catégories métier
--           et associer les secteurs d'activité pertinents pour chaque produit
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: AJOUT DE LA COLONNE SECTEURS_ACTIVITE
-- ============================================================================

-- Ajouter la colonne secteurs_activite (JSONB) pour stocker la liste des secteurs
-- Un produit peut être associé à plusieurs secteurs d'activité
ALTER TABLE "ProduitEligible" 
ADD COLUMN IF NOT EXISTS "secteurs_activite" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "ProduitEligible"."secteurs_activite" IS 'Liste des secteurs d''activité pertinents pour ce produit (ex: ["Transport et Logistique", "Commerce et Distribution"]). Vide [] signifie tous secteurs.';

-- Créer un index GIN pour les recherches rapides sur les secteurs
CREATE INDEX IF NOT EXISTS idx_produit_eligible_secteurs_activite 
ON "ProduitEligible" USING GIN ("secteurs_activite");

-- ============================================================================
-- ÉTAPE 2: MISE À JOUR DES CATÉGORIES
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
-- ÉTAPE 3: ASSOCIATION DES SECTEURS D'ACTIVITÉ PAR PRODUIT
-- ============================================================================

-- Liste des secteurs d'activité disponibles (alignés sur GENERAL_001)
-- 'Transport et Logistique'
-- 'Commerce et Distribution'
-- 'Industrie et Fabrication'
-- 'Services aux Entreprises'
-- 'BTP et Construction'
-- 'Restauration et Hôtellerie'
-- 'Santé et Services Sociaux'
-- 'Agriculture et Agroalimentaire'
-- 'Services à la Personne'
-- 'Autre secteur'

-- DFS (Déduction Forfaitaire Spéciale) - Spécifique au Transport et Logistique
-- La DFS concerne les fiches de paie des employés (déduction forfaitaire spécifique)
-- Elle est réservée aux entreprises de transport routier
-- Elle concerne principalement le secteur Transport et Logistique
UPDATE "ProduitEligible"
SET "secteurs_activite" = '["Transport et Logistique"]'::jsonb
WHERE "nom" = 'DFS';

-- TICPE - Transport, Agriculture et BTP/Construction
-- Remboursement partiel de la TICPE pour :
-- - Transport routier (Transport et Logistique)
-- - Agriculture (véhicules agricoles, engins)
-- - BTP/Construction (engins de chantier, véhicules de travaux publics)
UPDATE "ProduitEligible"
SET "secteurs_activite" = '["Transport et Logistique", "Agriculture et Agroalimentaire", "BTP et Construction"]'::jsonb
WHERE "nom" = 'TICPE';

-- Chronotachygraphes digitaux - Transport, Agriculture et BTP
-- Obligatoires pour les véhicules de plus de 7,5T
-- Mêmes critères que Logiciel Solid : véhicules Oui, type +7,5T
-- Concerné par :
-- - Transport et Logistique (poids lourds, véhicules de transport)
-- - Agriculture et Agroalimentaire (tracteurs, machines agricoles lourdes)
-- - BTP et Construction (engins de chantier, véhicules de travaux publics)
UPDATE "ProduitEligible"
SET "secteurs_activite" = '["Transport et Logistique", "Agriculture et Agroalimentaire", "BTP et Construction"]'::jsonb
WHERE "nom" = 'Chronotachygraphes digitaux';

-- Logiciel Solid - Transport, Agriculture et BTP
-- Logiciel de gestion des temps d'activités des conducteurs
-- Critère : véhicules Oui, type +7,5T
-- Concerné par :
-- - Transport et Logistique (poids lourds, véhicules de transport)
-- - Agriculture et Agroalimentaire (tracteurs, machines agricoles lourdes)
-- - BTP et Construction (engins de chantier, véhicules de travaux publics)
UPDATE "ProduitEligible"
SET "secteurs_activite" = '["Transport et Logistique", "Agriculture et Agroalimentaire", "BTP et Construction"]'::jsonb
WHERE "nom" = 'Logiciel Solid';

-- MSA - Agriculture et Agroalimentaire uniquement
-- Mutuelle Sociale Agricole : régime de protection sociale spécifique au secteur agricole
-- Pas d'autres secteurs concernés (régime dédié exclusivement à l'agriculture)
UPDATE "ProduitEligible"
SET "secteurs_activite" = '["Agriculture et Agroalimentaire"]'::jsonb
WHERE "nom" = 'MSA';

-- Produits UNIVERSELS (tous secteurs) - Tableau vide [] signifie tous secteurs
-- Ces produits sont applicables à tous les secteurs d'activité
-- Note: "Optimisation Énergie" a été remplacé par les deux produits spécifiques (électricité et gaz)
UPDATE "ProduitEligible"
SET "secteurs_activite" = '[]'::jsonb
WHERE "nom" IN (
    'CEE',                              -- Tous secteurs (économies d'énergie)
    'FONCIER',                          -- Tous secteurs (propriétaires immobiliers)
    'Optimisation fournisseur électricité', -- Tous secteurs
    'Optimisation fournisseur gaz',     -- Tous secteurs
    'Recouvrement',                     -- Tous secteurs
    'TVA',                              -- Tous secteurs
    'URSSAF'                            -- Tous secteurs
);

-- ============================================================================
-- ÉTAPE 4: VÉRIFICATIONS
-- ============================================================================

-- Vérifier la répartition par catégorie
SELECT 
    "categorie",
    COUNT(*) as nombre_produits,
    STRING_AGG("nom", ', ' ORDER BY "nom") as produits
FROM "ProduitEligible"
GROUP BY "categorie"
ORDER BY "categorie";

-- Vérifier les secteurs d'activité par produit
SELECT 
    "nom",
    "categorie",
    "secteurs_activite",
    CASE 
        WHEN jsonb_array_length("secteurs_activite") = 0 THEN 'Tous secteurs'
        ELSE jsonb_array_length("secteurs_activite")::text || ' secteur(s)'
    END as portee_secteurs
FROM "ProduitEligible"
ORDER BY "categorie", "nom";

-- Vérifier qu'il n'y a plus de produits sans catégorie
SELECT 
    id,
    nom,
    "categorie",
    "secteurs_activite"
FROM "ProduitEligible"
WHERE "categorie" IS NULL OR "categorie" = '';

-- Statistiques par secteur
SELECT 
    secteur,
    COUNT(*) as nombre_produits,
    STRING_AGG("nom", ', ' ORDER BY "nom") as produits
FROM (
    SELECT 
        "nom",
        jsonb_array_elements_text("secteurs_activite") as secteur
    FROM "ProduitEligible"
    WHERE jsonb_array_length("secteurs_activite") > 0
) subquery
GROUP BY secteur
ORDER BY nombre_produits DESC;

-- Produits universels (tous secteurs)
SELECT 
    "nom",
    "categorie"
FROM "ProduitEligible"
WHERE jsonb_array_length("secteurs_activite") = 0
ORDER BY "categorie", "nom";

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

-- Pour filtrer les produits par secteur d'activité :
-- SELECT * FROM "ProduitEligible"
-- WHERE "secteurs_activite" = '[]'::jsonb  -- Produits universels
--    OR "secteurs_activite" @> '["Transport et Logistique"]'::jsonb;  -- Produits spécifiques

-- Pour trouver tous les produits applicables à un secteur donné :
-- SELECT * FROM "ProduitEligible"
-- WHERE "secteurs_activite" = '[]'::jsonb  -- Universels
--    OR "secteurs_activite" @> '["Transport et Logistique"]'::jsonb;  -- Contient le secteur

-- Pour le matching expert-client :
-- 1. Récupérer le secteur d'activité du client (réponse à GENERAL_001)
-- 2. Filtrer les ProduitEligible selon ce secteur
-- 3. Filtrer les experts qui ont ces produits dans leurs spécialisations
-- 4. Améliorer le score de matching si l'expert a aussi ce secteur dans ses secteurs d'activité

