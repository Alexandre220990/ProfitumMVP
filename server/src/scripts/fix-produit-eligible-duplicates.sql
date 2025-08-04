-- Script de migration pour résoudre les doublons dans ProduitEligible
-- Date: $(date)
-- Description: Fusion des colonnes doublons dureeMax/duree_max et categorie/category

-- 1. Sauvegarder les données importantes avant migration
CREATE TABLE IF NOT EXISTS "ProduitEligible_backup" AS 
SELECT * FROM "ProduitEligible";

-- 2. Fusionner dureeMax et duree_max
-- Si duree_max est NULL mais dureeMax a une valeur, copier dureeMax vers duree_max
UPDATE "ProduitEligible" 
SET duree_max = dureeMax 
WHERE duree_max IS NULL AND dureeMax IS NOT NULL;

-- Si dureeMax est NULL mais duree_max a une valeur, copier duree_max vers dureeMax
UPDATE "ProduitEligible" 
SET dureeMax = duree_max 
WHERE dureeMax IS NULL AND duree_max IS NOT NULL;

-- 3. Fusionner categorie et category
-- Si category est NULL mais categorie a une valeur, copier categorie vers category
UPDATE "ProduitEligible" 
SET category = categorie 
WHERE category IS NULL AND categorie IS NOT NULL;

-- Si categorie est NULL mais category a une valeur, copier category vers categorie
UPDATE "ProduitEligible" 
SET categorie = category 
WHERE categorie IS NULL AND category IS NOT NULL;

-- 4. Vérifier les incohérences (optionnel - pour audit)
SELECT 
    id,
    nom,
    dureeMax,
    duree_max,
    CASE 
        WHEN dureeMax != duree_max THEN 'INCOHÉRENT'
        ELSE 'OK'
    END as duree_status,
    categorie,
    category,
    CASE 
        WHEN categorie != category THEN 'INCOHÉRENT'
        ELSE 'OK'
    END as category_status
FROM "ProduitEligible" 
WHERE dureeMax != duree_max OR categorie != category;

-- 5. Nettoyer les colonnes doublons (à exécuter après vérification)
-- ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS dureeMax;
-- ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS categorie;

-- 6. Renommer les colonnes pour cohérence
-- ALTER TABLE "ProduitEligible" RENAME COLUMN duree_max TO dureeMax;
-- ALTER TABLE "ProduitEligible" RENAME COLUMN category TO categorie;

-- 7. Ajouter des contraintes pour éviter les doublons futurs
-- ALTER TABLE "ProduitEligible" ADD CONSTRAINT unique_produit_nom UNIQUE (nom);
-- ALTER TABLE "ProduitEligible" ADD CONSTRAINT check_duree_positive CHECK (duree_max > 0);
-- ALTER TABLE "ProduitEligible" ADD CONSTRAINT check_montant_positive CHECK (montant_min > 0 AND montant_max > montant_min); 