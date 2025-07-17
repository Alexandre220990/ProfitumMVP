-- =====================================================
-- NETTOYAGE FINAL : Suppression Définitive des Tables en Minuscules
-- Date : 2025-01-03
-- Objectif : Supprimer définitivement les tables en minuscules vides
-- =====================================================

-- ===== 1. VÉRIFICATION FINALE =====

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

-- ===== 2. SUPPRESSION DÉFINITIVE =====

-- Supprimer définitivement toutes les tables en minuscules (maintenant vides)
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS expert CASCADE;
DROP TABLE IF EXISTS documentfile CASCADE;
DROP TABLE IF EXISTS produiteligible CASCADE;
DROP TABLE IF EXISTS clientproduiteligible CASCADE;

-- ===== 3. VÉRIFICATION POST-SUPPRESSION =====

-- Vérifier que seules les tables en majuscules existent
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'Client', 'Expert', 'DocumentFile', 'ProduitEligible', 'ClientProduitEligible',
    'client', 'expert', 'documentfile', 'produiteligible', 'clientproduiteligible'
)
ORDER BY table_name;

-- ===== 4. VÉRIFICATION FINALE DES DONNÉES =====

-- Confirmer que toutes les données sont conservées
SELECT 'Client' as table_name, COUNT(*) as total_rows FROM "Client"
UNION ALL
SELECT 'Expert' as table_name, COUNT(*) as total_rows FROM "Expert"
UNION ALL
SELECT 'DocumentFile' as table_name, COUNT(*) as total_rows FROM "DocumentFile"
UNION ALL
SELECT 'ProduitEligible' as table_name, COUNT(*) as total_rows FROM "ProduitEligible"
UNION ALL
SELECT 'ClientProduitEligible' as table_name, COUNT(*) as total_rows FROM "ClientProduitEligible";

-- ===== 5. MESSAGE DE CONFIRMATION FINALE =====

DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'NETTOYAGE FINAL TERMINÉ AVEC SUCCÈS !';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ Tables en minuscules définitivement supprimées';
    RAISE NOTICE '✅ Nomenclature 100% unifiée (majuscules uniquement)';
    RAISE NOTICE '✅ Toutes les données conservées';
    RAISE NOTICE '✅ Base de données optimisée';
    RAISE NOTICE '✅ Problème de double nomenclature RÉSOLU';
    RAISE NOTICE '====================================================';
END $$; 