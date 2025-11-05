-- =====================================================
-- MIGRATION ALAIN & ALBA - VERSION CLEAN
-- Date : 2025-11-05
-- Alba: be2cf2fb-c102-494d-b7ba-fb4196d49f02
-- Alain: 4c367715-56e3-4992-b9aa-80e4fd48ca6c
-- =====================================================

-- ===== 1. ÉTAT ACTUEL DES CLIENTS =====
SELECT 
    '👤 CLIENTS' as section,
    c.id,
    c.email,
    c.name,
    c.company_name,
    c.type,
    c.statut,
    c.created_at,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits
FROM "Client" c
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.created_at;

-- ===== 2. SIMULATIONS TEMPORAIRES CANDIDATES =====
SELECT 
    '🔍 SIMULATIONS CANDIDATES' as section,
    CASE 
        WHEN s.created_at < TIMESTAMP '2025-11-05 12:31:32+00' THEN 'ALBA'
        ELSE 'ALAIN'
    END as pour_qui,
    s.id as simulation_id,
    s.session_token,
    s.client_id,
    c.email as client_email_actuel,
    c.type as client_type,
    s.type as sim_type,
    s.status,
    TO_CHAR(s.created_at, 'HH24:MI:SS') as heure_creation,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
        THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
        ELSE 0
    END as nb_reponses
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at BETWEEN 
    TIMESTAMP '2025-11-05 12:00:00+00' AND 
    TIMESTAMP '2025-11-05 12:52:09+00'
AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp' OR c.id IS NULL)
ORDER BY s.created_at DESC;

-- ===== 3. CLIENTS TEMPORAIRES =====
SELECT 
    '👻 CLIENTS TEMPORAIRES' as section,
    c.id,
    c.email,
    c.company_name,
    TO_CHAR(c.created_at, 'HH24:MI:SS') as heure,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations
FROM "Client" c
WHERE c.created_at >= DATE_TRUNC('day', NOW())
AND c.type = 'temporaire'
ORDER BY c.created_at DESC;

-- ===== 4. PRODUITS ÉLIGIBLES ACTUELS =====
SELECT 
    '📦 PRODUITS ACTUELS' as section,
    c.email,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe."simulationId"
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, cpe."dateEligibilite" DESC;

-- ===== 5. MIGRATION ALBA =====
-- Identifier la simulation
WITH alba_simulation AS (
    SELECT s.id, s.client_id as old_client_id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:31:32+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:00:00+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1
)
-- Afficher d'abord ce qui sera migré
SELECT 
    '🔄 MIGRATION ALBA' as action,
    id as simulation_id,
    old_client_id,
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02'::uuid as new_client_id
FROM alba_simulation;

-- Exécuter la migration Alba
UPDATE simulations
SET 
    client_id = 'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    type = 'authentifiee',
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'migrated_at', NOW(),
        'migrated_from', 'temporary_client',
        'migration_reason', 'client_registration'
    )
WHERE id = (
    SELECT s.id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:31:32+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:00:00+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1
);

-- Migrer les produits Alba
UPDATE "ClientProduitEligible"
SET "clientId" = 'be2cf2fb-c102-494d-b7ba-fb4196d49f02'
WHERE "simulationId" = (
    SELECT s.id
    FROM simulations s
    WHERE s.client_id = 'be2cf2fb-c102-494d-b7ba-fb4196d49f02'
    ORDER BY s.created_at DESC
    LIMIT 1
)
OR "clientId" IN (
    SELECT client_id 
    FROM simulations 
    WHERE id = (
        SELECT s.id
        FROM simulations s
        WHERE s.client_id = 'be2cf2fb-c102-494d-b7ba-fb4196d49f02'
        ORDER BY s.created_at DESC
        LIMIT 1
    )
);

-- ===== 6. MIGRATION ALAIN =====
-- Identifier la simulation
WITH alain_simulation AS (
    SELECT s.id, s.client_id as old_client_id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:52:09+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:31:32+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1
)
-- Afficher d'abord ce qui sera migré
SELECT 
    '🔄 MIGRATION ALAIN' as action,
    id as simulation_id,
    old_client_id,
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'::uuid as new_client_id
FROM alain_simulation;

-- Exécuter la migration Alain
UPDATE simulations
SET 
    client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    type = 'authentifiee',
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'migrated_at', NOW(),
        'migrated_from', 'temporary_client',
        'migration_reason', 'client_registration'
    )
WHERE id = (
    SELECT s.id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:52:09+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:31:32+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1
);

-- Migrer les produits Alain
UPDATE "ClientProduitEligible"
SET "clientId" = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
WHERE "simulationId" = (
    SELECT s.id
    FROM simulations s
    WHERE s.client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
    ORDER BY s.created_at DESC
    LIMIT 1
)
OR "clientId" IN (
    SELECT client_id 
    FROM simulations 
    WHERE id = (
        SELECT s.id
        FROM simulations s
        WHERE s.client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
        ORDER BY s.created_at DESC
        LIMIT 1
    )
);

-- ===== 7. VÉRIFICATION POST-MIGRATION =====
SELECT 
    '✅ RÉSULTAT FINAL' as section,
    c.email,
    c.name,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id AND type = 'authentifiee') as nb_sim_auth,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits,
    (SELECT SUM("montantFinal") FROM "ClientProduitEligible" WHERE "clientId" = c.id) as montant_total
FROM "Client" c
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email;

-- Détails des simulations migrées
SELECT 
    'SIMULATIONS MIGRÉES' as type,
    c.email,
    s.id as simulation_id,
    s.type,
    s.status,
    s.created_at,
    s.metadata->>'migrated_at' as migrated_at
FROM simulations s
JOIN "Client" c ON c.id = s.client_id
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, s.created_at DESC;

