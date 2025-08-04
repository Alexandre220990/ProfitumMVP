-- Script de migration simplifié pour ProduitEligible
-- Version sécurisée avec vérifications

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ProduitEligible' 
ORDER BY column_name;

-- 2. Vérifier les données existantes
SELECT 
    id,
    nom,
    "dureeMax" as duree_max_old,
    duree_max as duree_max_new,
    categorie as categorie_old,
    category as category_new
FROM "ProduitEligible" 
LIMIT 10;

-- 3. Compter les incohérences
SELECT 
    COUNT(*) as total_produits,
    COUNT(CASE WHEN "dureeMax" IS NOT NULL AND duree_max IS NULL THEN 1 END) as duree_max_missing,
    COUNT(CASE WHEN categorie IS NOT NULL AND category IS NULL THEN 1 END) as category_missing
FROM "ProduitEligible";

-- 4. Migration sécurisée (décommenter pour exécuter)
/*
-- Copier dureeMax vers duree_max si duree_max est NULL
UPDATE "ProduitEligible" 
SET duree_max = "dureeMax" 
WHERE duree_max IS NULL AND "dureeMax" IS NOT NULL;

-- Copier categorie vers category si category est NULL
UPDATE "ProduitEligible" 
SET category = categorie 
WHERE category IS NULL AND categorie IS NOT NULL;

-- Vérifier après migration
SELECT 
    COUNT(*) as total_produits,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as duree_max_filled,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as category_filled
FROM "ProduitEligible";
*/ 