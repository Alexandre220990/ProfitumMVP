-- ============================================================================
-- SCRIPT DE NETTOYAGE - SUPPRESSION DES TABLES PROSPECT INUTILES
-- ============================================================================
-- Objectif : Supprimer toutes les tables Prospect* pour utiliser uniquement
--            la table Client avec status = 'prospect'
-- Date : 2025-01-03
-- Auteur : Équipe Technique Profitum
-- ============================================================================

-- ⚠️  ATTENTION : Ce script supprime définitivement les tables !
-- ⚠️  Faire une sauvegarde avant d'exécuter !

BEGIN;

-- ===== SUPPRESSION DES TABLES PROSPECT =====

-- 1. Supprimer les tables de liaison Prospect
DROP TABLE IF EXISTS "ProspectProduit" CASCADE;
DROP TABLE IF EXISTS "ProspectExpert" CASCADE;
DROP TABLE IF EXISTS "ProspectRDV" CASCADE;
DROP TABLE IF EXISTS "ProspectMeeting" CASCADE;
DROP TABLE IF EXISTS "ProspectStatut" CASCADE;

-- 2. Supprimer les tables de conversion et suivi
DROP TABLE IF EXISTS "ProspectConversion" CASCADE;

-- 3. Supprimer la table principale Prospect
DROP TABLE IF EXISTS "Prospect" CASCADE;

-- ===== VÉRIFICATION DES TABLES RESTANTES =====

-- Afficher les tables restantes liées aux prospects/clients
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%Client%' 
    OR table_name LIKE '%Apporteur%'
    OR table_name LIKE '%Expert%'
)
ORDER BY table_name;

-- ===== VÉRIFICATION DES COLONNES CLIENT =====

-- Afficher les colonnes de la table Client pour vérifier la structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===== MESSAGE DE CONFIRMATION =====

DO $$
BEGIN
    RAISE NOTICE '✅ NETTOYAGE TERMINÉ !';
    RAISE NOTICE '✅ Tables Prospect supprimées avec succès';
    RAISE NOTICE '✅ Table Client conservée avec status = ''prospect''';
    RAISE NOTICE '✅ Architecture simplifiée et optimisée';
END $$;

-- ===== COMMIT DES CHANGEMENTS =====

COMMIT;

-- ============================================================================
-- RÉSUMÉ DES ACTIONS EFFECTUÉES :
-- ============================================================================
-- ❌ Supprimé : Prospect
-- ❌ Supprimé : ProspectProduit  
-- ❌ Supprimé : ProspectExpert
-- ❌ Supprimé : ProspectRDV
-- ❌ Supprimé : ProspectMeeting
-- ❌ Supprimé : ProspectStatut
-- ❌ Supprimé : ProspectConversion
-- ✅ Conservé : Client (avec status = 'prospect')
-- ✅ Conservé : ClientExpert
-- ✅ Conservé : ClientRDV
-- ✅ Conservé : ClientStatut
-- ✅ Conservé : ClientProduitEligible
-- ✅ Conservé : ApporteurAffaires
-- ============================================================================
