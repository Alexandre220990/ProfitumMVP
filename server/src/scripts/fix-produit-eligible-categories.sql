-- Script de correction pour le produit incohérent
-- Basé sur les résultats : 9 cohérents, 1 incohérent

-- 1. Identifier le produit incohérent
SELECT 
    id,
    nom,
    categorie,
    category,
    CASE 
        WHEN categorie != category THEN 'INCOHÉRENT'
        ELSE 'OK'
    END as status
FROM "ProduitEligible" 
WHERE categorie != category;

-- 2. Corriger le produit incohérent
-- Copier category vers categorie pour le produit incohérent
UPDATE "ProduitEligible" 
SET categorie = category 
WHERE categorie != category;

-- 3. Vérifier la correction
SELECT 
    id,
    nom,
    categorie,
    category,
    CASE 
        WHEN categorie = category THEN 'CORRIGÉ'
        ELSE 'ENCORE INCOHÉRENT'
    END as status
FROM "ProduitEligible" 
WHERE id IN (
    SELECT id FROM "ProduitEligible" 
    WHERE categorie != category
);

-- 4. Vérification finale
SELECT 
    COUNT(*) as total_produits,
    COUNT(CASE WHEN categorie = category THEN 1 END) as coherents,
    COUNT(CASE WHEN categorie != category THEN 1 END) as incoherents
FROM "ProduitEligible"; 