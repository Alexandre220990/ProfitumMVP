-- =====================================================
-- URGENCE: RESTAURER LES PRODUITS D'ALAIN
-- Date : 2025-11-05
-- Les produits ont été supprimés par erreur
-- =====================================================

-- Simulation active d'Alain: d7f1d6cd-622e-4554-a16f-f7116e6872aa
-- Client ID: 4c367715-56e3-4992-b9aa-80e4fd48ca6c

-- ===== 1. VÉRIFIER L'ÉTAT ACTUEL =====
SELECT 
    '❌ ÉTAT ACTUEL (PROBLÈME)' as section,
    c.email,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits
FROM "Client" c
WHERE c.id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c';

-- ===== 2. RÉCUPÉRER LES RÉPONSES DE LA SIMULATION =====
SELECT 
    '📋 RÉPONSES DE LA SIMULATION' as section,
    s.id,
    s.answers
FROM simulations s
WHERE s.id = 'd7f1d6cd-622e-4554-a16f-f7116e6872aa';

-- ===== 3. RECALCULER LES PRODUITS ÉLIGIBLES =====
-- Extraire les question_ids des réponses et appeler la fonction d'éligibilité

-- D'abord, lister les IDs de produits disponibles
SELECT 
    '🔍 PRODUITS DISPONIBLES' as section,
    id,
    nom,
    type_produit
FROM "ProduitEligible"
WHERE est_actif = true
ORDER BY nom;

-- ===== 4. RECRÉER LES PRODUITS MANUELLEMENT =====
-- Basé sur les réponses de la simulation (8 réponses complètes)

-- Réponses connues d'Alain (simulation d7f1d6cd):
-- 8 réponses dans answers (format UUID)

-- Option A: Insérer les produits identifiés précédemment
-- DFS: 18 000 000€
INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    "simulationId",
    statut,
    "montantFinal",
    "tauxFinal",
    "dureeFinale",
    notes,
    priorite,
    "dateEligibilite",
    metadata
) VALUES (
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    (SELECT id FROM "ProduitEligible" WHERE nom = 'DFS' LIMIT 1),
    'd7f1d6cd-622e-4554-a16f-f7116e6872aa',
    'eligible',
    18000000,
    NULL,
    12,
    'Dispositif de Fin de Service - Montant important',
    1,
    NOW(),
    jsonb_build_object(
        'source', 'manual_restoration',
        'restored_at', NOW(),
        'reason', 'products_deleted_by_error'
    )
)
ON CONFLICT DO NOTHING
RETURNING id, 'DFS créé' as action;

-- Recouvrement: 75 000€
INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    "simulationId",
    statut,
    "montantFinal",
    "tauxFinal",
    "dureeFinale",
    notes,
    priorite,
    "dateEligibilite",
    metadata
) VALUES (
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    (SELECT id FROM "ProduitEligible" WHERE nom = 'Recouvrement' LIMIT 1),
    'd7f1d6cd-622e-4554-a16f-f7116e6872aa',
    'eligible',
    75000,
    NULL,
    12,
    'Recouvrement de créances',
    2,
    NOW(),
    jsonb_build_object(
        'source', 'manual_restoration',
        'restored_at', NOW(),
        'reason', 'products_deleted_by_error'
    )
)
ON CONFLICT DO NOTHING
RETURNING id, 'Recouvrement créé' as action;

-- URSSAF: 10 500€
INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    "simulationId",
    statut,
    "montantFinal",
    "tauxFinal",
    "dureeFinale",
    notes,
    priorite,
    "dateEligibilite",
    metadata
) VALUES (
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    (SELECT id FROM "ProduitEligible" WHERE nom = 'URSSAF' OR nom = 'MSA' LIMIT 1),
    'd7f1d6cd-622e-4554-a16f-f7116e6872aa',
    'eligible',
    10500,
    NULL,
    12,
    'Optimisation cotisations sociales',
    3,
    NOW(),
    jsonb_build_object(
        'source', 'manual_restoration',
        'restored_at', NOW(),
        'reason', 'products_deleted_by_error'
    )
)
ON CONFLICT DO NOTHING
RETURNING id, 'URSSAF créé' as action;

-- Chronotachygraphes digitaux: 0€
INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    "simulationId",
    statut,
    "montantFinal",
    "tauxFinal",
    "dureeFinale",
    notes,
    priorite,
    "dateEligibilite",
    metadata
) VALUES (
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    (SELECT id FROM "ProduitEligible" WHERE nom LIKE '%Chronotachy%' LIMIT 1),
    'd7f1d6cd-622e-4554-a16f-f7116e6872aa',
    'eligible',
    0,
    NULL,
    12,
    'Chronotachygraphes digitaux - Obligation légale',
    4,
    NOW(),
    jsonb_build_object(
        'source', 'manual_restoration',
        'restored_at', NOW(),
        'reason', 'products_deleted_by_error'
    )
)
ON CONFLICT DO NOTHING
RETURNING id, 'Chronotachygraphes créé' as action;

-- Logiciel Solid: 0€
INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    "simulationId",
    statut,
    "montantFinal",
    "tauxFinal",
    "dureeFinale",
    notes,
    priorite,
    "dateEligibilite",
    metadata
) VALUES (
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    (SELECT id FROM "ProduitEligible" WHERE nom LIKE '%Solid%' LIMIT 1),
    'd7f1d6cd-622e-4554-a16f-f7116e6872aa',
    'eligible',
    0,
    NULL,
    12,
    'Logiciel de gestion Solid',
    5,
    NOW(),
    jsonb_build_object(
        'source', 'manual_restoration',
        'restored_at', NOW(),
        'reason', 'products_deleted_by_error'
    )
)
ON CONFLICT DO NOTHING
RETURNING id, 'Logiciel Solid créé' as action;

-- ===== 5. VÉRIFICATION APRÈS RESTAURATION =====
SELECT 
    '✅ ÉTAT APRÈS RESTAURATION' as section,
    c.email,
    c.name,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits,
    (SELECT SUM("montantFinal") FROM "ClientProduitEligible" WHERE "clientId" = c.id) as montant_total
FROM "Client" c
WHERE c.id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c';

-- Détails des produits restaurés
SELECT 
    '📦 PRODUITS RESTAURÉS' as section,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe."simulationId",
    cpe.metadata->>'restored_at' as restored_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE cpe."clientId" = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
ORDER BY cpe."dateEligibilite" DESC;

-- ===== 6. RÉSUMÉ FINAL DES DEUX CLIENTS =====
SELECT 
    '📊 RÉSUMÉ FINAL ALBA & ALAIN' as section,
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

