-- =====================================================
-- RECHERCHE DES PRODUITS ÉLIGIBLES EXISTANTS
-- Pour les simulations d'Alba et Alain
-- =====================================================

-- Simulations identifiées:
-- Alba: f95c0102-2ead-4f02-a0da-7d40a6f3d3dc (10 réponses, terminee)
-- Alain: b925dda7-d034-4a13-8ccc-89f588ab1dfd (11 réponses, terminee)
-- Alain temp: d7f1d6cd-622e-4554-a16f-f7116e6872aa (8 réponses, completed)

-- ===== 1. CHERCHER TOUS LES PRODUITS LIÉS À CES SIMULATIONS =====
SELECT 
    '🔍 PRODUITS PAR SIMULATION' as section,
    s.id as simulation_id,
    c.email,
    c.id as client_id,
    s.status as sim_status,
    cpe.id as produit_id,
    p.nom as produit_nom,
    cpe.statut,
    cpe."montantFinal",
    cpe."dateEligibilite"
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."simulationId" = s.id
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE s.id IN (
    'f95c0102-2ead-4f02-a0da-7d40a6f3d3dc',
    'b925dda7-d034-4a13-8ccc-89f588ab1dfd',
    'd7f1d6cd-622e-4554-a16f-f7116e6872aa'
)
ORDER BY s.id, cpe."dateEligibilite" DESC;

-- ===== 2. CHERCHER PAR CLIENT_ID (au cas où simulationId serait NULL) =====
SELECT 
    '🔍 PRODUITS PAR CLIENT' as section,
    c.email,
    c.id as client_id,
    cpe.id as produit_id,
    p.nom as produit_nom,
    cpe.statut,
    cpe."montantFinal",
    cpe."simulationId",
    cpe."dateEligibilite"
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, cpe."dateEligibilite" DESC;

-- ===== 3. CHERCHER TOUS LES CLIENTS TEMPORAIRES AVEC PRODUITS =====
SELECT 
    '👻 CLIENTS TEMPORAIRES AVEC PRODUITS' as section,
    c.id as temp_client_id,
    c.email as temp_email,
    COUNT(cpe.id) as nb_produits,
    SUM(cpe."montantFinal") as montant_total,
    (SELECT s.id FROM simulations s WHERE s.client_id = c.id LIMIT 1) as simulation_id
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.type = 'temporaire'
AND c.created_at >= DATE_TRUNC('day', NOW())
GROUP BY c.id, c.email
HAVING COUNT(cpe.id) > 0
ORDER BY c.created_at DESC;

-- ===== 4. LISTER LES PRODUITS DES CLIENTS TEMPORAIRES =====
SELECT 
    '📦 DÉTAILS PRODUITS CLIENTS TEMPORAIRES' as section,
    c.email as temp_email,
    c.id as temp_client_id,
    s.id as simulation_id,
    s.session_token,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe.id as cpe_id
FROM "Client" c
LEFT JOIN simulations s ON s.client_id = c.id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.type = 'temporaire'
AND c.created_at >= DATE_TRUNC('day', NOW())
AND cpe.id IS NOT NULL
ORDER BY c.email, cpe."dateEligibilite" DESC;

-- ===== 5. IDENTIFIER LES CLIENTS TEMPORAIRES CORRESPONDANTS =====
-- Client temporaire d'Alba (avant 12:31:32)
SELECT 
    '🎯 CLIENT TEMPORAIRE ALBA' as section,
    c.id as temp_client_id,
    c.email,
    c.created_at,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits
FROM "Client" c
WHERE c.type = 'temporaire'
AND c.created_at < TIMESTAMP '2025-11-05 12:31:32+00'
AND c.created_at > TIMESTAMP '2025-11-05 12:00:00+00'
ORDER BY c.created_at DESC
LIMIT 1;

-- Client temporaire d'Alain (avant 12:52:09)
SELECT 
    '🎯 CLIENT TEMPORAIRE ALAIN' as section,
    c.id as temp_client_id,
    c.email,
    c.created_at,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits
FROM "Client" c
WHERE c.type = 'temporaire'
AND c.created_at < TIMESTAMP '2025-11-05 12:52:09+00'
AND c.created_at > TIMESTAMP '2025-11-05 12:31:32+00'
ORDER BY c.created_at DESC
LIMIT 1;

-- ===== 6. MIGRATION DES PRODUITS SI ILS EXISTENT =====
-- Si des produits existent sur les clients temporaires, les migrer

-- Pour Alba: chercher client temporaire et migrer ses produits
WITH alba_temp_client AS (
    SELECT c.id as temp_client_id
    FROM "Client" c
    WHERE c.type = 'temporaire'
    AND c.created_at < TIMESTAMP '2025-11-05 12:31:32+00'
    AND c.created_at > TIMESTAMP '2025-11-05 12:00:00+00'
    ORDER BY c.created_at DESC
    LIMIT 1
)
UPDATE "ClientProduitEligible"
SET 
    "clientId" = 'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    "simulationId" = 'f95c0102-2ead-4f02-a0da-7d40a6f3d3dc'
WHERE "clientId" IN (SELECT temp_client_id FROM alba_temp_client)
RETURNING 
    id,
    "clientId",
    "simulationId",
    'ALBA - Produit migré' as action;

-- Pour Alain: chercher client temporaire et migrer ses produits
WITH alain_temp_client AS (
    SELECT c.id as temp_client_id
    FROM "Client" c
    WHERE c.type = 'temporaire'
    AND c.created_at < TIMESTAMP '2025-11-05 12:52:09+00'
    AND c.created_at > TIMESTAMP '2025-11-05 12:31:32+00'
    ORDER BY c.created_at DESC
    LIMIT 1
)
UPDATE "ClientProduitEligible"
SET 
    "clientId" = '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    "simulationId" = 'b925dda7-d034-4a13-8ccc-89f588ab1dfd'
WHERE "clientId" IN (SELECT temp_client_id FROM alain_temp_client)
RETURNING 
    id,
    "clientId",
    "simulationId",
    'ALAIN - Produit migré' as action;

-- ===== 7. VÉRIFICATION FINALE =====
SELECT 
    '✅ VÉRIFICATION FINALE' as section,
    c.email,
    c.name,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits,
    (SELECT SUM("montantFinal") FROM "ClientProduitEligible" WHERE "clientId" = c.id) as montant_total
FROM "Client" c
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email;

-- Détails des produits
SELECT 
    '📦 PRODUITS FINAUX' as section,
    c.email,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe."simulationId",
    cpe."dateEligibilite"
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, cpe."dateEligibilite" DESC;

