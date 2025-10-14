-- Supprimer les ClientProduitEligible incomplets (données corrompues)
-- ⚠️ À exécuter APRÈS avoir vérifié les données avec analyze-clientproduit-data.sql
-- À exécuter dans Supabase SQL Editor

-- Option 1: Supprimer TOUS les ClientProduitEligible existants (si tous incomplets)
DELETE FROM "ClientProduitEligible";

-- Vérification
SELECT COUNT(*) as remaining_rows FROM "ClientProduitEligible";

-- Option 2: Supprimer seulement ceux sans produit (si certains sont valides)
-- DELETE FROM "ClientProduitEligible" 
-- WHERE "produitId" IS NULL 
--    OR "produitId" NOT IN (SELECT id FROM "ProduitEligible");

