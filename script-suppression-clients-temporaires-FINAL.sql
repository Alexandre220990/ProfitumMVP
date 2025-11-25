-- ============================================================================
-- SCRIPT DE SUPPRESSION CLIENTS TEMPORAIRES (VERSION FINALE - Basée sur vos FK)
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Supprimer tous les clients temporaires ayant un email temporaire
-- Version: Finale - Utilise uniquement les tables qui existent et respecte les FK
-- Critères: Uniquement les emails temporaires (@profitum.temp, temp_%, @temp)
--           EXCLUT les clients avec emails normaux même si type = 'temporaire'
-- ============================================================================
-- IMPORTANT: Ordre de suppression basé sur les règles FK détectées
-- - NO ACTION: RDV_Task, RDV_Timeline (supprimer AVANT les clients)
-- - SET NULL: ClientProduitEligible, GEDDocument (peuvent être supprimés après)
-- - CASCADE: Toutes les autres (suppression automatique, mais explicitement fait)
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
    -- Uniquement les emails temporaires (exclut les emails normaux même si type = 'temporaire')
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
ORDER BY created_at DESC;

-- Compter les clients temporaires
SELECT 
    COUNT(*) as total_clients_temporaires
FROM "Client"
WHERE 
    -- Uniquement les emails temporaires (exclut les emails normaux même si type = 'temporaire')
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%';

-- ============================================================================
-- ÉTAPE 2 : CRÉER TABLE TEMPORAIRE AVEC LES IDs
-- ============================================================================

CREATE TEMP TABLE IF NOT EXISTS temp_client_ids AS
SELECT id
FROM "Client"
WHERE 
    -- Uniquement les emails temporaires (exclut les emails normaux même si type = 'temporaire')
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%';

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LES DÉPENDANCES AVANT SUPPRESSION
-- ============================================================================

SELECT '⚠️ ÉTAPE 2 : VÉRIFICATION DES DÉPENDANCES' as etape;

SELECT 
    'RDV_Task (NO ACTION)' as table_name,
    COUNT(*) as nombre_dependances
FROM "RDV_Task"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'RDV_Timeline (NO ACTION)' as table_name,
    COUNT(*) as nombre_dependances
FROM "RDV_Timeline"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'ClientProduitEligible (SET NULL)' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'ClientProcessDocument' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'simulations' as table_name,
    COUNT(*) as nombre_dependances
FROM simulations
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'simulationhistory' as table_name,
    COUNT(*) as nombre_dependances
FROM simulationhistory
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'RDV' as table_name,
    COUNT(*) as nombre_dependances
FROM "RDV"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'Appointment' as table_name,
    COUNT(*) as nombre_dependances
FROM "Appointment"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'Reminder' as table_name,
    COUNT(*) as nombre_dependances
FROM "Reminder"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'expertassignment' as table_name,
    COUNT(*) as nombre_dependances
FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'ClientExpert' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientExpert"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'client_charte_signature' as table_name,
    COUNT(*) as nombre_dependances
FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'client_timeline' as table_name,
    COUNT(*) as nombre_dependances
FROM client_timeline
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'document_request' as table_name,
    COUNT(*) as nombre_dependances
FROM document_request
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'SharedClientDocument' as table_name,
    COUNT(*) as nombre_dependances
FROM "SharedClientDocument"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'GEDDocument' as table_name,
    COUNT(*) as nombre_dependances
FROM "GEDDocument"
WHERE created_by IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'ClientStatut' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientStatut"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'Dossier' as table_name,
    COUNT(*) as nombre_dependances
FROM "Dossier"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'notification' as table_name,
    COUNT(*) as nombre_dependances
FROM notification
WHERE user_id IN (SELECT id FROM temp_client_ids)
   AND user_type = 'client'

ORDER BY nombre_dependances DESC;

-- ============================================================================
-- ÉTAPE 4 : SUPPRESSION EN CASCADE (DANS LE BON ORDRE SELON LES FK)
-- ============================================================================

SELECT '🗑️ ÉTAPE 3 : SUPPRESSION DES DONNÉES LIÉES' as etape;

-- ⚠️ IMPORTANT: Ordre basé sur les règles FK détectées
-- Les tables avec NO ACTION doivent être supprimées AVANT les clients

-- ========================================
-- PRIORITÉ 1 : Tables avec NO ACTION (à supprimer AVANT les clients)
-- ========================================

SELECT '   → Suppression des tâches RDV (RDV_Task - NO ACTION)...' as action;
DELETE FROM "RDV_Task"
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression de la timeline RDV (RDV_Timeline - NO ACTION)...' as action;
DELETE FROM "RDV_Timeline"
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- ========================================
-- PRIORITÉ 2 : Tables avec CASCADE (suppression automatique mais explicitement fait)
-- ========================================

-- Documents et fichiers
SELECT '   → Suppression des documents clients (ClientProcessDocument)...' as action;
DELETE FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des documents partagés (SharedClientDocument)...' as action;
DELETE FROM "SharedClientDocument"
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des documents GED (GEDDocument - SET NULL)...' as action;
DELETE FROM "GEDDocument"
WHERE created_by IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des demandes de documents (document_request)...' as action;
DELETE FROM document_request
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- Dossiers et produits
SELECT '   → Suppression des dossiers (Dossier)...' as action;
DELETE FROM "Dossier"
WHERE "clientId" IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des produits éligibles clients (ClientProduitEligible - SET NULL)...' as action;
DELETE FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des statuts clients (ClientStatut)...' as action;
DELETE FROM "ClientStatut"
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- Rendez-vous et rendez-vous
SELECT '   → Suppression des rendez-vous (RDV)...' as action;
DELETE FROM "RDV"
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des rendez-vous (Appointment)...' as action;
DELETE FROM "Appointment"
WHERE "clientId" IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des rappels (Reminder)...' as action;
DELETE FROM "Reminder"
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- Simulations
SELECT '   → Suppression des simulations (simulations)...' as action;
DELETE FROM simulations
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression de l''historique simulations (simulationhistory)...' as action;
DELETE FROM simulationhistory
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- Expert et assignations
SELECT '   → Suppression des assignations expert (expertassignment)...' as action;
DELETE FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression des relations client-expert (ClientExpert)...' as action;
DELETE FROM "ClientExpert"
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- Signatures et timeline
SELECT '   → Suppression des signatures de charte (client_charte_signature)...' as action;
DELETE FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_client_ids);

SELECT '   → Suppression de la timeline client (client_timeline)...' as action;
DELETE FROM client_timeline
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- Notifications
SELECT '   → Suppression des notifications (notification)...' as action;
DELETE FROM notification
WHERE user_id IN (SELECT id FROM temp_client_ids)
   AND user_type = 'client';

-- ========================================
-- PRIORITÉ 3 : ENFIN supprimer les clients temporaires
-- ========================================

SELECT '   → Suppression des clients temporaires (Client)...' as action;
DELETE FROM "Client"
WHERE id IN (SELECT id FROM temp_client_ids);

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-SUPPRESSION
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
    -- Uniquement les emails temporaires (exclut les emails normaux même si type = 'temporaire')
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%';

-- Vérifier qu'il ne reste plus de dépendances orphelines
SELECT 
    'Vérification dépendances orphelines' as verification,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProduitEligible" 
        WHERE "clientId" IN (SELECT id FROM temp_client_ids)
    ), 0) as dependances_orphelines;

-- Nettoyer la table temporaire
DROP TABLE IF EXISTS temp_client_ids;

COMMIT;

SELECT '✅ SUPPRESSION TERMINÉE! Vérifiez les résultats ci-dessus.' as resultat;
SELECT '⚠️ NOTE: Les comptes Supabase Auth doivent être supprimés manuellement depuis le Dashboard Supabase → Authentication → Users' as note;

