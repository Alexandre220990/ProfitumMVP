-- =====================================================
-- NETTOYAGE : Suppression des Tables en Minuscules Vides
-- Date : 2025-01-03
-- Objectif : Supprimer les tables en minuscules vides pour unifier la nomenclature
-- =====================================================

-- ===== 1. VÉRIFICATION PRÉ-NETTOYAGE =====

-- Vérifier que les tables en minuscules sont bien vides
SELECT 'client' as table_name, COUNT(*) as row_count FROM client
UNION ALL
SELECT 'expert' as table_name, COUNT(*) as row_count FROM expert
UNION ALL
SELECT 'documentfile' as table_name, COUNT(*) as row_count FROM documentfile
UNION ALL
SELECT 'produiteligible' as table_name, COUNT(*) as row_count FROM produiteligible
UNION ALL
SELECT 'clientproduiteligible' as table_name, COUNT(*) as row_count FROM clientproduiteligible;

-- ===== 2. SUPPRESSION DES TABLES EN MINUSCULES =====

-- Supprimer les tables en minuscules (vides)
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS expert CASCADE;
DROP TABLE IF EXISTS documentfile CASCADE;
DROP TABLE IF EXISTS produiteligible CASCADE;
DROP TABLE IF EXISTS clientproduiteligible CASCADE;

-- ===== 3. VÉRIFICATION POST-NETTOYAGE =====

-- Vérifier que seules les tables en majuscules existent
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'Client', 'Expert', 'DocumentFile', 'ProduitEligible', 'ClientProduitEligible',
    'client', 'expert', 'documentfile', 'produiteligible', 'clientproduiteligible'
)
ORDER BY table_name;

-- ===== 4. VÉRIFICATION DES TABLES RESTANTES =====

-- Compter les lignes dans les tables en majuscules
SELECT 'Client' as table_name, COUNT(*) as total_rows FROM "Client"
UNION ALL
SELECT 'Expert' as table_name, COUNT(*) as total_rows FROM "Expert"
UNION ALL
SELECT 'DocumentFile' as table_name, COUNT(*) as total_rows FROM "DocumentFile"
UNION ALL
SELECT 'ProduitEligible' as table_name, COUNT(*) as total_rows FROM "ProduitEligible"
UNION ALL
SELECT 'ClientProduitEligible' as table_name, COUNT(*) as total_rows FROM "ClientProduitEligible";

-- ===== 5. OPTIMISATION DES INDEX =====

-- Recréer les index sur les tables en majuscules
CREATE INDEX IF NOT EXISTS idx_client_email ON "Client" (email);
CREATE INDEX IF NOT EXISTS idx_client_siren ON "Client" (siren);
CREATE INDEX IF NOT EXISTS idx_expert_name ON "Expert" (name);
CREATE INDEX IF NOT EXISTS idx_expert_company ON "Expert" (company_name);
CREATE INDEX IF NOT EXISTS idx_documentfile_client ON "DocumentFile" (client_id);
CREATE INDEX IF NOT EXISTS idx_documentfile_expert ON "DocumentFile" (expert_id);
CREATE INDEX IF NOT EXISTS idx_produiteligible_nom ON "ProduitEligible" (nom);
CREATE INDEX IF NOT EXISTS idx_clientproduiteligible_client ON "ClientProduitEligible" ("clientId");
CREATE INDEX IF NOT EXISTS idx_clientproduiteligible_produit ON "ClientProduitEligible" ("produitId");

-- ===== 6. MESSAGE DE CONFIRMATION =====

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'NETTOYAGE TERMINÉ AVEC SUCCÈS !';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ Tables en minuscules supprimées';
    RAISE NOTICE '✅ Nomenclature unifiée (majuscules uniquement)';
    RAISE NOTICE '✅ Index optimisés';
    RAISE NOTICE '✅ Base de données nettoyée';
    RAISE NOTICE '====================================================';
END $$; 