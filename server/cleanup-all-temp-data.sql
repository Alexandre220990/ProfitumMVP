-- Script de nettoyage complet des tables temporaires
-- À exécuter dans Supabase SQL Editor
-- ATTENTION: Ce script supprime TOUTES les données temporaires

-- 1. Vérifier les données avant suppression
SELECT 
    'AVANT SUPPRESSION' as phase,
    'TemporarySession' as table_name,
    COUNT(*) as record_count
FROM "TemporarySession"
UNION ALL
SELECT 
    'AVANT SUPPRESSION' as phase,
    'TemporaryEligibility' as table_name,
    COUNT(*) as record_count
FROM "TemporaryEligibility"
UNION ALL
SELECT 
    'AVANT SUPPRESSION' as phase,
    'TemporaryResponse' as table_name,
    COUNT(*) as record_count
FROM "TemporaryResponse"
UNION ALL
SELECT 
    'AVANT SUPPRESSION' as phase,
    'SimulatorAnalytics' as table_name,
    COUNT(*) as record_count
FROM "SimulatorAnalytics";

-- 2. Supprimer toutes les données des tables temporaires
-- Supprimer dans l'ordre pour respecter les contraintes de clés étrangères

-- Supprimer les éligibilités temporaires
DELETE FROM "TemporaryEligibility";

-- Supprimer les réponses temporaires
DELETE FROM "TemporaryResponse";

-- Supprimer les analytics du simulateur
DELETE FROM "SimulatorAnalytics";

-- Supprimer les sessions temporaires
DELETE FROM "TemporarySession";

-- 3. Vérifier que toutes les données ont été supprimées
SELECT 
    'APRÈS SUPPRESSION' as phase,
    'TemporarySession' as table_name,
    COUNT(*) as record_count
FROM "TemporarySession"
UNION ALL
SELECT 
    'APRÈS SUPPRESSION' as phase,
    'TemporaryEligibility' as table_name,
    COUNT(*) as record_count
FROM "TemporaryEligibility"
UNION ALL
SELECT 
    'APRÈS SUPPRESSION' as phase,
    'TemporaryResponse' as table_name,
    COUNT(*) as record_count
FROM "TemporaryResponse"
UNION ALL
SELECT 
    'APRÈS SUPPRESSION' as phase,
    'SimulatorAnalytics' as table_name,
    COUNT(*) as record_count
FROM "SimulatorAnalytics";

-- 4. Vérifier que les tables principales sont intactes
SELECT 
    'TABLES PRINCIPALES' as category,
    'Client' as table_name,
    COUNT(*) as record_count
FROM "Client"
UNION ALL
SELECT 
    'TABLES PRINCIPALES' as category,
    'ClientProduitEligible' as table_name,
    COUNT(*) as record_count
FROM "ClientProduitEligible"
UNION ALL
SELECT 
    'TABLES PRINCIPALES' as category,
    'ProduitEligible' as table_name,
    COUNT(*) as record_count
FROM "ProduitEligible";

-- 5. Optionnel : Supprimer complètement les tables temporaires
-- (Décommenter seulement si vous êtes sûr qu'aucune application n'utilise ces tables)
/*
DROP TABLE IF EXISTS "TemporaryEligibility" CASCADE;
DROP TABLE IF EXISTS "TemporaryResponse" CASCADE;
DROP TABLE IF EXISTS "SimulatorAnalytics" CASCADE;
DROP TABLE IF EXISTS "TemporarySession" CASCADE;
DROP TABLE IF EXISTS "SimulatorFollowUp" CASCADE;

-- Supprimer les vues associées
DROP VIEW IF EXISTS "SimulatorStats" CASCADE;
DROP VIEW IF EXISTS "SimulatorProductStats" CASCADE;

-- Supprimer les fonctions associées
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS mark_session_completed(text) CASCADE;
*/

-- 6. Confirmation finale
SELECT 
    'NETTOYAGE TERMINÉ' as status,
    'Toutes les données temporaires ont été supprimées' as message,
    NOW() as cleanup_timestamp; 