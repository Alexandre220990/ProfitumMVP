-- ============================================================================
-- SCRIPT DE VÉRIFICATION CLIENTS TEMPORAIRES (DRY RUN)
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Vérifier les clients temporaires et leurs dépendances SANS SUPPRIMER
-- Usage: Exécuter ce script AVANT script-suppression-clients-temporaires.sql
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : IDENTIFIER LES CLIENTS TEMPORAIRES
-- ============================================================================

SELECT 
    '📋 CLIENTS TEMPORAIRES IDENTIFIÉS' as etape,
    NULL::int as nombre;

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
        WHEN type = 'temporaire' THEN 'Type temporaire'
        ELSE 'Autre'
    END as critere_identification
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire'
ORDER BY created_at DESC;

-- ============================================================================
-- ÉTAPE 2 : COMPTER LES CLIENTS TEMPORAIRES
-- ============================================================================

SELECT 
    '📊 TOTAL CLIENTS TEMPORAIRES' as etape,
    COUNT(*)::int as nombre
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire';

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER LES DÉPENDANCES GLOBALES
-- ============================================================================

SELECT 
    '⚠️ RÉCAPITULATIF DES DÉPENDANCES' as etape,
    NULL::int as nombre;

-- Créer une CTE pour les IDs des clients temporaires
WITH temp_clients AS (
    SELECT id
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        OR type = 'temporaire'
)
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

-- Charter table n'existe pas dans cette base de données
-- UNION ALL

SELECT 
    'Audit (clientId)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Audit"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Audit (client_id)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Audit"
WHERE "client_id" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'ClientProcessDocument' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'simulations' as table_name,
    COUNT(*)::int as nombre_dependances
FROM simulations
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Simulation' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Simulation"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'client_charte_signature' as table_name,
    COUNT(*)::int as nombre_dependances
FROM client_charte_signature
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'conversations' as table_name,
    COUNT(*)::int as nombre_dependances
FROM conversations
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'document_request' as table_name,
    COUNT(*)::int as nombre_dependances
FROM document_request
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'CalendarEvent' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "CalendarEvent"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'message' as table_name,
    COUNT(*)::int as nombre_dependances
FROM message
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'notification (client_id)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM notification
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'notification (user_id)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM notification
WHERE user_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'expertassignment' as table_name,
    COUNT(*)::int as nombre_dependances
FROM expertassignment
WHERE client_id IN (SELECT id FROM temp_clients)

ORDER BY nombre_dependances DESC;

-- ============================================================================
-- ÉTAPE 4 : DÉTAIL DES DÉPENDANCES PAR CLIENT
-- ============================================================================

SELECT 
    '📋 DÉTAIL PAR CLIENT' as etape,
    NULL::int as nombre;

WITH temp_clients AS (
    SELECT id, email, company_name
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        OR type = 'temporaire'
)
SELECT 
    c.id as client_id,
    c.email,
    c.company_name,
    c.created_at,
    COUNT(DISTINCT cpe.id) as nb_dossiers,
    COUNT(DISTINCT cpd.id) as nb_documents,
    COUNT(DISTINCT ch.id) as nb_charters,
    COUNT(DISTINCT a.id) as nb_audits,
    COUNT(DISTINCT sim.id) as nb_simulations,
    COUNT(DISTINCT conv.id) as nb_conversations,
    (COUNT(DISTINCT cpe.id) + COUNT(DISTINCT cpd.id) + 
     COUNT(DISTINCT a.id) + COUNT(DISTINCT sim.id) + COUNT(DISTINCT conv.id)) as total_dependances
FROM temp_clients c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_id = c.id
LEFT JOIN "Charter" ch ON ch."clientId" = c.id
LEFT JOIN "Audit" a ON (a."clientId" = c.id OR a."client_id" = c.id)
LEFT JOIN simulations sim ON sim.client_id = c.id
LEFT JOIN "Simulation" sim2 ON sim2."clientId" = c.id
LEFT JOIN conversations conv ON conv.client_id = c.id
GROUP BY c.id, c.email, c.company_name, c.created_at
ORDER BY (COUNT(DISTINCT cpe.id) + COUNT(DISTINCT cpd.id) + COUNT(DISTINCT a.id) + COUNT(DISTINCT sim.id) + COUNT(DISTINCT conv.id)) DESC, c.created_at DESC;

-- ============================================================================
-- ÉTAPE 5 : CLIENT AVEC LE PLUS DE DÉPENDANCES (ATTENTION)
-- ============================================================================

SELECT 
    '⚠️ CLIENTS AVEC DÉPENDANCES IMPORTANTES' as etape,
    NULL::int as nombre;

WITH temp_clients AS (
    SELECT id, email, company_name
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        OR type = 'temporaire'
),
client_deps AS (
    SELECT 
        c.id,
        c.email,
        c.company_name,
        COUNT(DISTINCT cpe.id) as nb_dossiers,
        COUNT(DISTINCT cpd.id) as nb_documents,
        COUNT(DISTINCT ch.id) as nb_charters,
        COUNT(DISTINCT a.id) as nb_audits,
        COUNT(DISTINCT sim.id) as nb_simulations,
        COUNT(DISTINCT conv.id) as nb_conversations,
        (COUNT(DISTINCT cpe.id) + COUNT(DISTINCT cpd.id) + 
         COUNT(DISTINCT a.id) + COUNT(DISTINCT sim.id) + COUNT(DISTINCT conv.id)) as total
    FROM temp_clients c
    LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
    LEFT JOIN "ClientProcessDocument" cpd ON cpd.client_id = c.id
    LEFT JOIN "Charter" ch ON ch."clientId" = c.id
    LEFT JOIN "Audit" a ON (a."clientId" = c.id OR a."client_id" = c.id)
    LEFT JOIN simulations sim ON sim.client_id = c.id
    LEFT JOIN conversations conv ON conv.client_id = c.id
    GROUP BY c.id, c.email, c.company_name
    HAVING (COUNT(DISTINCT cpe.id) + COUNT(DISTINCT cpd.id) + 
            COUNT(DISTINCT a.id) + COUNT(DISTINCT sim.id) + COUNT(DISTINCT conv.id)) > 0
)
SELECT 
    id,
    email,
    company_name,
    nb_dossiers,
    nb_documents,
        0 as nb_charters, -- Charter table n'existe pas
    nb_audits,
    nb_simulations,
    nb_conversations,
    total as total_dependances
FROM client_deps
ORDER BY total DESC;

-- ============================================================================
-- ÉTAPE 6 : RÉSUMÉ POUR DÉCISION
-- ============================================================================

SELECT 
    '📊 RÉSUMÉ EXÉCUTIF' as etape,
    NULL::int as nombre;

WITH temp_clients AS (
    SELECT id
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        OR type = 'temporaire'
)
SELECT 
    'Clients temporaires à supprimer' as element,
    COUNT(DISTINCT c.id)::int as nombre
FROM "Client" c
WHERE c.id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Dossiers (ClientProduitEligible) à supprimer' as element,
    COUNT(*)::int as nombre
FROM "ClientProduitEligible"
WHERE "clientId" IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Documents (ClientProcessDocument) à supprimer' as element,
    COUNT(*)::int as nombre
FROM "ClientProcessDocument"
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'Simulations à supprimer' as element,
    COUNT(*)::int as nombre
FROM simulations
WHERE client_id IN (SELECT id FROM temp_clients)

UNION ALL

SELECT 
    'TOTAL LIGNES À SUPPRIMER' as element,
    (
        (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM "ClientProcessDocument" WHERE client_id IN (SELECT id FROM temp_clients)) +
        -- (SELECT COUNT(*) FROM "Charter" WHERE "clientId" IN (SELECT id FROM temp_clients)) + -- Table n'existe pas
        (SELECT COUNT(*) FROM "Audit" WHERE "clientId" IN (SELECT id FROM temp_clients) OR "client_id" IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM simulations WHERE client_id IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM "Simulation" WHERE "clientId" IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM conversations WHERE client_id IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM message WHERE client_id IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM notification WHERE client_id IN (SELECT id FROM temp_clients) OR user_id IN (SELECT id FROM temp_clients)) +
        (SELECT COUNT(*) FROM temp_clients)
    )::int as nombre;

\echo ''
\echo '✅ VÉRIFICATION TERMINÉE'
\echo ''
\echo '⚠️ PROCHAINES ÉTAPES:'
\echo '1. Vérifiez les résultats ci-dessus'
\echo '2. Si tout est correct, exécutez: script-suppression-clients-temporaires.sql'
\echo '3. Les clients avec des dépendances seront supprimés avec leurs données liées'
\echo ''

