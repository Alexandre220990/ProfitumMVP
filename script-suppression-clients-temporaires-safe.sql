-- ============================================================================
-- SCRIPT DE SUPPRESSION CLIENTS TEMPORAIRES (VERSION SAFE)
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Supprimer tous les clients temporaires ayant un email temporaire
-- Version: Safe - Vérifie l'existence des tables avant de les utiliser
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : IDENTIFIER LES CLIENTS TEMPORAIRES
-- ============================================================================

SELECT '🔍 ÉTAPE 1 : IDENTIFICATION DES CLIENTS TEMPORAIRES' as etape;

SELECT 
    id,
    email,
    name,
    company_name,
    type,
    statut,
    created_at,
    expires_at
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire'
ORDER BY created_at DESC;

-- Compter les clients temporaires
SELECT 
    COUNT(*) as total_clients_temporaires
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire';

-- ============================================================================
-- ÉTAPE 2 : VÉRIFIER TOUTES LES DÉPENDANCES (OBLIGATOIRE)
-- ============================================================================

SELECT '⚠️ ÉTAPE 2 : VÉRIFICATION DES DÉPENDANCES' as etape;

-- Créer une table temporaire avec les IDs des clients temporaires
CREATE TEMP TABLE IF NOT EXISTS temp_client_ids AS
SELECT id
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire';

-- Compter les dépendances par table (seulement pour les tables existantes)
SELECT '📊 RÉCAPITULATIF DES DÉPENDANCES:' as etape;

-- Utiliser des sous-requêtes avec EXISTS pour vérifier l'existence des tables
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'Audit (clientId)' as table_name,
    COUNT(*) as nombre_dependances
FROM "Audit"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit')

UNION ALL

SELECT 
    'Audit (client_id)' as table_name,
    COUNT(*) as nombre_dependances
FROM "Audit"
WHERE "client_id" IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit')

UNION ALL

SELECT 
    'ClientProcessDocument' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument')

UNION ALL

SELECT 
    'simulations' as table_name,
    COUNT(*) as nombre_dependances
FROM simulations
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'simulations')

UNION ALL

SELECT 
    'Simulation' as table_name,
    COUNT(*) as nombre_dependances
FROM "Simulation"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Simulation')

UNION ALL

SELECT 
    'client_charte_signature' as table_name,
    COUNT(*) as nombre_dependances
FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_charte_signature')

UNION ALL

SELECT 
    'conversations' as table_name,
    COUNT(*) as nombre_dependances
FROM conversations
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations')

UNION ALL

SELECT 
    'document_request' as table_name,
    COUNT(*) as nombre_dependances
FROM document_request
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_request')

UNION ALL

SELECT 
    'CalendarEvent' as table_name,
    COUNT(*) as nombre_dependances
FROM "CalendarEvent"
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CalendarEvent')

UNION ALL

SELECT 
    'message' as table_name,
    COUNT(*) as nombre_dependances
FROM message
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message')

UNION ALL

SELECT 
    'notification' as table_name,
    COUNT(*) as nombre_dependances
FROM notification
WHERE (client_id IN (SELECT id FROM temp_client_ids) OR user_id IN (SELECT id FROM temp_client_ids))
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification')

UNION ALL

SELECT 
    'expertassignment' as table_name,
    COUNT(*) as nombre_dependances
FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_client_ids)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expertassignment')

ORDER BY nombre_dependances DESC;

-- ============================================================================
-- ÉTAPE 3 : SUPPRESSION EN CASCADE (DANS LE BON ORDRE)
-- ============================================================================

SELECT '🗑️ ÉTAPE 3 : SUPPRESSION DES DONNÉES LIÉES' as etape;

-- IMPORTANT: Supprimer dans l'ordre pour respecter les contraintes FK
-- Utiliser DO blocks pour vérifier l'existence avant de supprimer

-- 1. Supprimer les documents liés aux dossiers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument') THEN
        DELETE FROM "ClientProcessDocument"
        WHERE client_id IN (SELECT id FROM temp_client_ids)
           OR client_produit_id IN (
               SELECT id FROM "ClientProduitEligible" 
               WHERE "clientId" IN (SELECT id FROM temp_client_ids)
           );
        RAISE NOTICE 'Documents supprimés';
    END IF;
END $$;

-- 2. Supprimer les demandes de documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_request') THEN
        DELETE FROM document_request
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Demandes de documents supprimées';
    END IF;
END $$;

-- 3. Supprimer les dossiers (ClientProduitEligible) - les plus importants
DELETE FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_client_ids);

-- 4. Supprimer les chartes/contrats (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Charter') THEN
        DELETE FROM "Charter"
        WHERE "clientId" IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Chartes supprimées';
    END IF;
END $$;

-- 5. Supprimer les signatures de charte
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_charte_signature') THEN
        DELETE FROM client_charte_signature
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Signatures de charte supprimées';
    END IF;
END $$;

-- 6. Supprimer les audits
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit') THEN
        DELETE FROM "Audit"
        WHERE "clientId" IN (SELECT id FROM temp_client_ids)
           OR "client_id" IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Audits supprimés';
    END IF;
END $$;

-- 7. Supprimer les simulations (table simulations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'simulations') THEN
        DELETE FROM simulations
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Simulations (simulations) supprimées';
    END IF;
END $$;

-- 8. Supprimer les simulations (table Simulation)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Simulation') THEN
        DELETE FROM "Simulation"
        WHERE "clientId" IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Simulations (Simulation) supprimées';
    END IF;
END $$;

-- 9. Supprimer les événements calendrier
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CalendarEvent') THEN
        DELETE FROM "CalendarEvent"
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Événements calendrier supprimés';
    END IF;
END $$;

-- 10. Supprimer les conversations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        DELETE FROM conversations
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Conversations supprimées';
    END IF;
END $$;

-- 11. Supprimer les messages
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message') THEN
        DELETE FROM message
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Messages supprimés';
    END IF;
END $$;

-- 12. Supprimer les notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification') THEN
        DELETE FROM notification
        WHERE client_id IN (SELECT id FROM temp_client_ids)
           OR user_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Notifications supprimées';
    END IF;
END $$;

-- 13. Supprimer les assignations d'experts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expertassignment') THEN
        DELETE FROM expertassignment
        WHERE client_id IN (SELECT id FROM temp_client_ids);
        RAISE NOTICE 'Assignations expert supprimées';
    END IF;
END $$;

-- 14. ENFIN : Supprimer les clients temporaires
DELETE FROM "Client"
WHERE id IN (SELECT id FROM temp_client_ids);

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION POST-SUPPRESSION
-- ============================================================================

SELECT '✅ ÉTAPE 4 : VÉRIFICATION POST-SUPPRESSION' as etape;

-- Compter le nombre total de clients restants
SELECT 
    COUNT(*) as total_clients_restants
FROM "Client";

-- Vérifier qu'il ne reste plus de clients temporaires (devrait être 0)
SELECT 
    COUNT(*) as clients_temporaires_restants,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Aucun client temporaire restant'
        ELSE '⚠️ Il reste ' || COUNT(*)::text || ' client(s) temporaire(s)'
    END as statut
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire';

-- Nettoyer la table temporaire
DROP TABLE IF EXISTS temp_client_ids;

COMMIT;

SELECT '✅ SUPPRESSION TERMINÉE! Vérifiez les résultats ci-dessus.' as resultat;
SELECT '⚠️ NOTE: Les comptes Supabase Auth doivent être supprimés manuellement depuis le Dashboard Supabase → Authentication → Users' as note;

