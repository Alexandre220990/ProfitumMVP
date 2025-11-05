-- =====================================================
-- NETTOYAGE DES SIMULATIONS D'ALAIN
-- Date : 2025-11-05
-- Objectif : Supprimer la simulation vide qui bloque le dashboard
-- =====================================================

-- Alain a 3 simulations:
-- 1. 7f0fd68a-a90e-4893-8537-010dbeee1406 (en_cours, 0 réponses, 0 produits) ❌ À SUPPRIMER
-- 2. b925dda7-d034-4a13-8ccc-89f588ab1dfd (terminee, 11 réponses, 8 produits) ⚠️ Ancienne
-- 3. d7f1d6cd-622e-4554-a16f-f7116e6872aa (completed, 8 réponses, 5 produits) ✅ GARDER (la plus récente avec produits)

-- ===== 1. ÉTAT AVANT NETTOYAGE =====
SELECT 
    '📊 SIMULATIONS ALAIN AVANT' as section,
    s.id,
    s.type,
    s.status,
    s.created_at,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
        THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
        ELSE 0
    END as nb_reponses,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "simulationId" = s.id) as nb_produits
FROM simulations s
WHERE s.client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
ORDER BY s.created_at DESC;

-- ===== 2. SUPPRIMER LA SIMULATION VIDE =====
-- Celle créée à 12:52:10 (juste après l'inscription) qui n'a jamais été utilisée
DELETE FROM simulations
WHERE id = '7f0fd68a-a90e-4893-8537-010dbeee1406'
AND client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
RETURNING 
    id,
    'SUPPRIMÉE - Simulation vide' as action,
    created_at;

-- ===== 3. OPTIONNEL: SUPPRIMER L'ANCIENNE SIMULATION (celle avec 8 produits de faible valeur) =====
-- Commenter cette section si vous voulez garder l'historique

/*
-- Supprimer les produits de l'ancienne simulation d'abord
DELETE FROM "ClientProduitEligible"
WHERE "simulationId" = 'b925dda7-d034-4a13-8ccc-89f588ab1dfd'
AND "clientId" = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
RETURNING 
    id,
    'PRODUIT SUPPRIMÉ - Ancienne simulation' as action;

-- Puis supprimer la simulation
DELETE FROM simulations
WHERE id = 'b925dda7-d034-4a13-8ccc-89f588ab1dfd'
AND client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
RETURNING 
    id,
    'SUPPRIMÉE - Ancienne simulation' as action,
    created_at;
*/

-- ===== 4. METTRE À JOUR LE STATUS DE LA SIMULATION ACTIVE =====
-- S'assurer que la simulation d7f1d6cd est bien en statut "completed" et type "authentifiee"
UPDATE simulations
SET 
    status = 'completed',
    type = 'authentifiee',
    updated_at = NOW()
WHERE id = 'd7f1d6cd-622e-4554-a16f-f7116e6872aa'
AND client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
RETURNING 
    id,
    type,
    status,
    'Simulation mise à jour' as action;

-- ===== 5. ÉTAT APRÈS NETTOYAGE =====
SELECT 
    '📊 SIMULATIONS ALAIN APRÈS' as section,
    s.id,
    s.type,
    s.status,
    s.created_at,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
        THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
        ELSE 0
    END as nb_reponses,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "simulationId" = s.id) as nb_produits,
    (SELECT SUM("montantFinal") FROM "ClientProduitEligible" WHERE "simulationId" = s.id) as montant_total
FROM simulations s
WHERE s.client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
ORDER BY s.created_at DESC;

-- ===== 6. VÉRIFICATION DES PRODUITS =====
SELECT 
    '📦 PRODUITS ALAIN APRÈS NETTOYAGE' as section,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe."simulationId",
    cpe."dateEligibilite"
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE cpe."clientId" = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
ORDER BY cpe."dateEligibilite" DESC;

-- ===== 7. VÉRIFICATION FINALE GLOBALE =====
SELECT 
    '✅ RÉSUMÉ FINAL' as section,
    c.email,
    c.name,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id AND status = 'completed') as nb_sim_completed,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits,
    (SELECT SUM("montantFinal") FROM "ClientProduitEligible" WHERE "clientId" = c.id) as montant_total
FROM "Client" c
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email;

