-- ============================================================================
-- SCRIPT DE VÉRIFICATION CLIENTS TEMPORAIRES (VERSION FINALE)
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Vérifier les clients temporaires et leurs dépendances SANS SUPPRIMER
-- Version: Finale - Utilise uniquement les tables qui existent réellement
-- Critères: Uniquement les emails temporaires (@profitum.temp, temp_%, @temp)
--           EXCLUT les clients avec emails normaux même si type = 'temporaire'
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : IDENTIFIER LES CLIENTS TEMPORAIRES
-- ============================================================================

SELECT '📋 CLIENTS TEMPORAIRES IDENTIFIÉS' as etape, NULL::int as nombre;

SELECT 
    id,
    email,
    name,
    company_name,
    type,
    statut,
    created_at,
    expires_at,
    CASE 
        WHEN email LIKE '%@profitum.temp%' THEN 'Email profitum.temp'
        WHEN email LIKE 'temp_%@%' THEN 'Email temp_ prefix'
        WHEN email LIKE '%@temp%' THEN 'Email @temp'
        ELSE 'Autre'
    END as critere_identification
FROM "Client"
WHERE 
    -- Uniquement les emails temporaires (exclut les emails normaux même si type = 'temporaire')
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
ORDER BY created_at DESC;

-- ============================================================================
-- ÉTAPE 2 : COMPTER LES CLIENTS TEMPORAIRES
-- ============================================================================

SELECT '📊 TOTAL CLIENTS TEMPORAIRES' as etape, COUNT(*)::int as nombre
FROM "Client"
WHERE 
    -- Uniquement les emails temporaires (exclut les emails normaux même si type = 'temporaire')
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%';

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LES DÉPENDANCES GLOBALES
-- ============================================================================

SELECT '⚠️ RÉCAPITULATIF DES DÉPENDANCES (basé sur les tables existantes)' as etape, NULL::int as nombre;

-- Créer une CTE pour les IDs des clients temporaires
WITH temp_clients AS (
    SELECT id
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        -- OR type = 'temporaire' -- Retiré : on filtre uniquement par email temporaire
)
SELECT 
    'RDV_Task (NO ACTION - doit être supprimé AVANT)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "RDV_Task"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'RDV_Timeline (NO ACTION - doit être supprimé AVANT)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "RDV_Timeline"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'ClientProduitEligible (SET NULL)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'GEDDocument (SET NULL)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "GEDDocument"
WHERE created_by IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'ClientProcessDocument' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'SharedClientDocument' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "SharedClientDocument"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Dossier' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Dossier"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'ClientStatut' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientStatut"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'simulations' as table_name,
    COUNT(*)::int as nombre_dependances
FROM simulations
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'simulationhistory' as table_name,
    COUNT(*)::int as nombre_dependances
FROM simulationhistory
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'RDV' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "RDV"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Appointment' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Appointment"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Reminder' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Reminder"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'expertassignment' as table_name,
    COUNT(*)::int as nombre_dependances
FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'ClientExpert' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientExpert"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'client_charte_signature' as table_name,
    COUNT(*)::int as nombre_dependances
FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'client_timeline' as table_name,
    COUNT(*)::int as nombre_dependances
FROM client_timeline
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'document_request' as table_name,
    COUNT(*)::int as nombre_dependances
FROM document_request
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'notification' as table_name,
    COUNT(*)::int as nombre_dependances
FROM notification
WHERE user_id IN (SELECT id FROM temp_clients)
   AND user_type = 'client'

ORDER BY nombre_dependances DESC;

-- ============================================================================
-- ÉTAPE 4 : DÉTAIL DES DÉPENDANCES PAR CLIENT
-- ============================================================================

SELECT '📋 DÉTAIL PAR CLIENT' as etape, NULL::int as nombre;

WITH temp_clients AS (
    SELECT id, email, company_name, created_at
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        -- OR type = 'temporaire' -- Retiré : on filtre uniquement par email temporaire
)
SELECT 
    c.id as client_id,
    c.email,
    c.company_name,
    c.created_at,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProduitEligible" 
        WHERE "clientId" = c.id
    ), 0) as nb_dossiers,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProcessDocument" 
        WHERE client_id = c.id
    ), 0) as nb_documents,
    COALESCE((
        SELECT COUNT(*) 
        FROM "Dossier" 
        WHERE "clientId" = c.id
    ), 0) as nb_dossiers_complets,
    COALESCE((
        SELECT COUNT(*) 
        FROM simulations 
        WHERE client_id = c.id
    ), 0) + COALESCE((
        SELECT COUNT(*) 
        FROM simulationhistory 
        WHERE client_id = c.id
    ), 0) as nb_simulations,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV" 
        WHERE client_id = c.id
    ), 0) + COALESCE((
        SELECT COUNT(*) 
        FROM "Appointment" 
        WHERE "clientId" = c.id
    ), 0) as nb_rendez_vous,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Task" 
        WHERE client_id = c.id
    ), 0) as nb_taches_rdv,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Timeline" 
        WHERE client_id = c.id
    ), 0) as nb_timeline_rdv,
    (COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProduitEligible" 
        WHERE "clientId" = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProcessDocument" 
        WHERE client_id = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "Dossier" 
        WHERE "clientId" = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM simulations 
        WHERE client_id = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM simulationhistory 
        WHERE client_id = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV" 
        WHERE client_id = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "Appointment" 
        WHERE "clientId" = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Task" 
        WHERE client_id = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Timeline" 
        WHERE client_id = c.id
    ), 0)) as total_dependances
FROM temp_clients c
ORDER BY total_dependances DESC, c.created_at DESC;

-- ============================================================================
-- ÉTAPE 5 : CLIENTS AVEC DÉPENDANCES NO ACTION (ATTENTION)
-- ============================================================================

SELECT '⚠️ CLIENTS AVEC DÉPENDANCES NO ACTION (DOIVENT ÊTRE SUPPRIMÉS AVANT)' as etape, NULL::int as nombre;

WITH temp_clients AS (
    SELECT id, email, company_name
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        -- OR type = 'temporaire' -- Retiré : on filtre uniquement par email temporaire
)
SELECT 
    c.id,
    c.email,
    c.company_name,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Task" 
        WHERE client_id = c.id
    ), 0) as nb_taches_rdv,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Timeline" 
        WHERE client_id = c.id
    ), 0) as nb_timeline_rdv,
    (COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Task" 
        WHERE client_id = c.id
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Timeline" 
        WHERE client_id = c.id
    ), 0)) as total_no_action
FROM temp_clients c
WHERE 
    EXISTS (SELECT 1 FROM "RDV_Task" WHERE client_id = c.id)
    OR EXISTS (SELECT 1 FROM "RDV_Timeline" WHERE client_id = c.id)
ORDER BY total_no_action DESC;

-- ============================================================================
-- ÉTAPE 6 : RÉSUMÉ EXÉCUTIF
-- ============================================================================

SELECT '📊 RÉSUMÉ EXÉCUTIF' as etape, NULL::int as nombre;

WITH temp_clients AS (
    SELECT id
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        -- OR type = 'temporaire' -- Retiré : on filtre uniquement par email temporaire
)
SELECT 
    'Clients temporaires à supprimer' as element,
    COUNT(*)::int as nombre
FROM temp_clients

UNION ALL

SELECT 
    'Tâches RDV (NO ACTION - à supprimer AVANT)' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Task" 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre

UNION ALL

SELECT 
    'Timeline RDV (NO ACTION - à supprimer AVANT)' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM "RDV_Timeline" 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre

UNION ALL

SELECT 
    'Dossiers (ClientProduitEligible)' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProduitEligible" 
        WHERE "clientId" IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre

UNION ALL

SELECT 
    'Documents (ClientProcessDocument)' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProcessDocument" 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre

UNION ALL

SELECT 
    'Simulations à supprimer' as element,
    (COALESCE((
        SELECT COUNT(*) 
        FROM simulations 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0) + 
    COALESCE((
        SELECT COUNT(*) 
        FROM simulationhistory 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0))::int as nombre;

SELECT '✅ VÉRIFICATION TERMINÉE' as resultat;
SELECT '⚠️ IMPORTANT: Les tables avec NO ACTION (RDV_Task, RDV_Timeline) doivent être supprimées AVANT les clients' as note;

