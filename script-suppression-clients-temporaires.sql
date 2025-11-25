-- ============================================================================
-- SCRIPT DE SUPPRESSION CLIENTS TEMPORAIRES AVEC EMAIL TEMP
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Supprimer tous les clients temporaires ayant un email temporaire
-- Sécurité: Vérification complète des dépendances avant suppression
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
    -- Emails temporaires (pattern principal)
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    -- Clients avec type temporaire
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

-- Compter les dépendances par table
SELECT '📊 RÉCAPITULATIF DES DÉPENDANCES:' as etape;

SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as nombre_dependances
FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)

UNION ALL

-- Charter table n'existe pas dans cette base de données
-- UNION ALL

SELECT 
    'Audit' as table_name,
    COUNT(*) as nombre_dependances
FROM "Audit"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)
   OR "client_id" IN (SELECT id FROM temp_client_ids)

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
    'Simulation' as table_name,
    COUNT(*) as nombre_dependances
FROM "Simulation"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'client_charte_signature' as table_name,
    COUNT(*) as nombre_dependances
FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'conversations' as table_name,
    COUNT(*) as nombre_dependances
FROM conversations
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'document_request' as table_name,
    COUNT(*) as nombre_dependances
FROM document_request
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'CalendarEvent' as table_name,
    COUNT(*) as nombre_dependances
FROM "CalendarEvent"
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'message' as table_name,
    COUNT(*) as nombre_dependances
FROM message
WHERE client_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'notification' as table_name,
    COUNT(*) as nombre_dependances
FROM notification
WHERE client_id IN (SELECT id FROM temp_client_ids)
   OR user_id IN (SELECT id FROM temp_client_ids)

UNION ALL

SELECT 
    'expertassignment' as table_name,
    COUNT(*) as nombre_dependances
FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_client_ids)

ORDER BY nombre_dependances DESC;

-- ============================================================================
-- ÉTAPE 3 : DÉTAIL DES DÉPENDANCES PAR CLIENT
-- ============================================================================

SELECT '📋 DÉTAIL DES DÉPENDANCES PAR CLIENT:' as etape;

SELECT 
    c.id as client_id,
    c.email,
    c.company_name,
    COUNT(DISTINCT cpe.id) as nb_dossiers,
    COUNT(DISTINCT cpd.id) as nb_documents,
    0 as nb_charters, -- Charter table n'existe pas
    COUNT(DISTINCT a.id) as nb_audits
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_id = c.id
-- LEFT JOIN "Charter" ch ON ch."clientId" = c.id -- Table n'existe pas
LEFT JOIN "Audit" a ON (a."clientId" = c.id OR a."client_id" = c.id)
WHERE c.id IN (SELECT id FROM temp_client_ids)
GROUP BY c.id, c.email, c.company_name
ORDER BY (COUNT(DISTINCT cpe.id) + COUNT(DISTINCT cpd.id) + COUNT(DISTINCT a.id)) DESC;

-- ============================================================================
-- ÉTAPE 4 : SUPPRESSION EN CASCADE (DANS LE BON ORDRE)
-- ============================================================================

SELECT '🗑️ ÉTAPE 4 : SUPPRESSION DES DONNÉES LIÉES' as etape;

-- IMPORTANT: Supprimer dans l'ordre pour respecter les contraintes FK

-- 1. Supprimer les documents liés aux dossiers
SELECT '   → Suppression des documents (ClientProcessDocument)...' as action;
DELETE FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_client_ids)
   OR client_produit_id IN (
       SELECT id FROM "ClientProduitEligible" 
       WHERE "clientId" IN (SELECT id FROM temp_client_ids)
   );

-- 2. Supprimer les demandes de documents
SELECT '   → Suppression des demandes de documents (document_request)...' as action;
DELETE FROM document_request
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 3. Supprimer les dossiers (ClientProduitEligible) - les plus importants
SELECT '   → Suppression des dossiers (ClientProduitEligible)...' as action;
DELETE FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_client_ids);

-- 4. Supprimer les chartes/contrats (table Charter n'existe pas dans cette base)
-- SELECT '   → Suppression des chartes (Charter)...' as action;
-- DELETE FROM "Charter"
-- WHERE "clientId" IN (SELECT id FROM temp_client_ids);

-- 5. Supprimer les signatures de charte
SELECT '   → Suppression des signatures de charte (client_charte_signature)...' as action;
DELETE FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 6. Supprimer les audits
SELECT '   → Suppression des audits (Audit)...' as action;
DELETE FROM "Audit"
WHERE "clientId" IN (SELECT id FROM temp_client_ids)
   OR "client_id" IN (SELECT id FROM temp_client_ids);

-- 7. Supprimer les simulations (table simulations)
SELECT '   → Suppression des simulations (simulations)...' as action;
DELETE FROM simulations
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 8. Supprimer les simulations (table Simulation)
SELECT '   → Suppression des simulations (Simulation)...' as action;
DELETE FROM "Simulation"
WHERE "clientId" IN (SELECT id FROM temp_client_ids);

-- 9. Supprimer les événements calendrier
SELECT '   → Suppression des événements calendrier (CalendarEvent)...' as action;
DELETE FROM "CalendarEvent"
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 10. Supprimer les conversations
SELECT '   → Suppression des conversations (conversations)...' as action;
DELETE FROM conversations
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 11. Supprimer les messages
SELECT '   → Suppression des messages (message)...' as action;
DELETE FROM message
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 12. Supprimer les notifications
SELECT '   → Suppression des notifications (notification)...' as action;
DELETE FROM notification
WHERE client_id IN (SELECT id FROM temp_client_ids)
   OR user_id IN (SELECT id FROM temp_client_ids);

-- 13. Supprimer les assignations d'experts
SELECT '   → Suppression des assignations expert (expertassignment)...' as action;
DELETE FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_client_ids);

-- 14. ENFIN : Supprimer les clients temporaires
SELECT '   → Suppression des clients temporaires (Client)...' as action;
DELETE FROM "Client"
WHERE id IN (SELECT id FROM temp_client_ids);

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-SUPPRESSION
-- ============================================================================

SELECT '✅ ÉTAPE 5 : VÉRIFICATION POST-SUPPRESSION' as etape;

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

-- ============================================================================
-- NOTE IMPORTANTE : SUPPRESSION DES COMPTES AUTH
-- ============================================================================

SELECT '⚠️ NOTE IMPORTANTE: Les comptes Supabase Auth doivent être supprimés manuellement depuis le Dashboard Supabase → Authentication → Users' as note;

-- Nettoyer la table temporaire
DROP TABLE IF EXISTS temp_client_ids;

COMMIT;

SELECT '✅ SUPPRESSION TERMINÉE! Vérifiez les résultats ci-dessus.' as resultat;

