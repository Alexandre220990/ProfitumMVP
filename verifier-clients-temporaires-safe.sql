-- ============================================================================
-- SCRIPT DE VÉRIFICATION CLIENTS TEMPORAIRES (VERSION SAFE - Vérifie les tables)
-- ============================================================================
-- Date: 2025-01-XX
-- Objectif: Vérifier les clients temporaires et leurs dépendances SANS SUPPRIMER
-- Version: Safe - Vérifie l'existence des tables avant de les utiliser
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

SELECT '📊 TOTAL CLIENTS TEMPORAIRES' as etape, COUNT(*)::int as nombre
FROM "Client"
WHERE 
    email LIKE '%@profitum.temp%'
    OR email LIKE 'temp_%@%'
    OR email LIKE '%@temp%'
    OR type = 'temporaire';

-- ============================================================================
-- ÉTAPE 3 : VÉRIFIER L'EXISTENCE DES TABLES
-- ============================================================================

SELECT '🔍 VÉRIFICATION DES TABLES DISPONIBLES' as etape, NULL::int as nombre;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✅ Existe'
        ELSE '❌ N''existe pas'
    END as statut
FROM (VALUES 
    ('ClientProduitEligible'),
    ('Charter'),
    ('client_charte_signature'),
    ('Audit'),
    ('ClientProcessDocument'),
    ('simulations'),
    ('Simulation'),
    ('conversations'),
    ('document_request'),
    ('CalendarEvent'),
    ('message'),
    ('notification'),
    ('expertassignment')
) AS t(table_name);

-- ============================================================================
-- ÉTAPE 4 : VÉRIFIER LES DÉPENDANCES GLOBALES (Seulement pour les tables existantes)
-- ============================================================================

SELECT '⚠️ RÉCAPITULATIF DES DÉPENDANCES' as etape, NULL::int as nombre;

-- Créer une CTE pour les IDs des clients temporaires
WITH temp_clients AS (
    SELECT id
    FROM "Client"
    WHERE 
        email LIKE '%@profitum.temp%'
        OR email LIKE 'temp_%@%'
        OR email LIKE '%@temp%'
        OR type = 'temporaire'
),
existing_tables AS (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'ClientProduitEligible', 'Charter', 'client_charte_signature',
        'Audit', 'ClientProcessDocument', 'simulations', 'Simulation',
        'conversations', 'document_request', 'CalendarEvent',
        'message', 'notification', 'expertassignment'
    )
)
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientProduitEligible", existing_tables
WHERE "clientId" IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'ClientProduitEligible'

UNION ALL

SELECT 
    'Charter' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Charter", existing_tables
WHERE "clientId" IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'Charter'

UNION ALL

SELECT 
    'Audit (clientId)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Audit", existing_tables
WHERE "clientId" IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'Audit'

UNION ALL

SELECT 
    'Audit (client_id)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Audit", existing_tables
WHERE "client_id" IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'Audit'

UNION ALL

SELECT 
    'ClientProcessDocument' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "ClientProcessDocument", existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'ClientProcessDocument'

UNION ALL

SELECT 
    'simulations' as table_name,
    COUNT(*)::int as nombre_dependances
FROM simulations, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'simulations'

UNION ALL

SELECT 
    'Simulation' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "Simulation", existing_tables
WHERE "clientId" IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'Simulation'

UNION ALL

SELECT 
    'client_charte_signature' as table_name,
    COUNT(*)::int as nombre_dependances
FROM client_charte_signature, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'client_charte_signature'

UNION ALL

SELECT 
    'conversations' as table_name,
    COUNT(*)::int as nombre_dependances
FROM conversations, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'conversations'

UNION ALL

SELECT 
    'document_request' as table_name,
    COUNT(*)::int as nombre_dependances
FROM document_request, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'document_request'

UNION ALL

SELECT 
    'CalendarEvent' as table_name,
    COUNT(*)::int as nombre_dependances
FROM "CalendarEvent", existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'CalendarEvent'

UNION ALL

SELECT 
    'message' as table_name,
    COUNT(*)::int as nombre_dependances
FROM message, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'message'

UNION ALL

SELECT 
    'notification (client_id)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM notification, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'notification'

UNION ALL

SELECT 
    'notification (user_id)' as table_name,
    COUNT(*)::int as nombre_dependances
FROM notification, existing_tables
WHERE user_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'notification'

UNION ALL

SELECT 
    'expertassignment' as table_name,
    COUNT(*)::int as nombre_dependances
FROM expertassignment, existing_tables
WHERE client_id IN (SELECT id FROM temp_clients)
    AND existing_tables.table_name = 'expertassignment'

ORDER BY nombre_dependances DESC;

-- ============================================================================
-- ÉTAPE 5 : DÉTAIL DES DÉPENDANCES PAR CLIENT (Version simplifiée)
-- ============================================================================

SELECT '📋 DÉTAIL PAR CLIENT' as etape, NULL::int as nombre;

WITH temp_clients AS (
    SELECT id, email, company_name, created_at
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
        FROM "Audit" 
        WHERE "clientId" = c.id OR "client_id" = c.id
    ), 0) as nb_audits,
    COALESCE((
        SELECT COUNT(*) 
        FROM simulations 
        WHERE client_id = c.id
    ), 0) + COALESCE((
        SELECT COUNT(*) 
        FROM "Simulation" 
        WHERE "clientId" = c.id
    ), 0) as nb_simulations
FROM temp_clients c
ORDER BY (nb_dossiers + nb_documents + nb_audits + nb_simulations) DESC, c.created_at DESC;

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
        OR type = 'temporaire'
)
SELECT 
    'Clients temporaires à supprimer' as element,
    COUNT(*)::int as nombre
FROM temp_clients

UNION ALL

SELECT 
    'Dossiers (ClientProduitEligible) à supprimer' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProduitEligible" 
        WHERE "clientId" IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre

UNION ALL

SELECT 
    'Documents (ClientProcessDocument) à supprimer' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM "ClientProcessDocument" 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre

UNION ALL

SELECT 
    'Simulations à supprimer' as element,
    COALESCE((
        SELECT COUNT(*) 
        FROM simulations 
        WHERE client_id IN (SELECT id FROM temp_clients)
    ), 0)::int + COALESCE((
        SELECT COUNT(*) 
        FROM "Simulation" 
        WHERE "clientId" IN (SELECT id FROM temp_clients)
    ), 0)::int as nombre;

SELECT '✅ VÉRIFICATION TERMINÉE' as resultat;

