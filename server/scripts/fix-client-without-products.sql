-- Script de correction pour le client sans produits éligibles
-- Problème identifié: transport.dupont.2025.unique@test.fr a 0 produit éligible

-- 1. Vérification du client problématique
SELECT 'VÉRIFICATION CLIENT PROBLÉMATIQUE' as info;

SELECT 
    c.id,
    c.email,
    c.auth_id,
    c.company_name,
    c.created_at,
    COUNT(cpe.id) as produits_count
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email = 'transport.dupont.2025.unique@test.fr'
GROUP BY c.id, c.email, c.auth_id, c.company_name, c.created_at;

-- 2. Vérification des produits éligibles disponibles
SELECT 'PRODUITS ÉLIGIBLES DISPONIBLES' as info;

SELECT 
    id,
    nom,
    description,
    category,
    active
FROM "ProduitEligible"
WHERE active = true
ORDER BY nom;

-- 3. Vérification des simulations existantes pour ce client
SELECT 'SIMULATIONS EXISTANTES POUR CE CLIENT' as info;

SELECT 
    s.id,
    s."clientId",
    s.simulation_type,
    s.status,
    s.created_at,
    s.results
FROM "Simulation" s
WHERE s."clientId" = 'b4112dad-3e30-4335-968c-802baccbbb0f'
ORDER BY s.created_at DESC;

-- 4. Solutions possibles

-- Option A: Créer des produits éligibles de test pour ce client
SELECT 'OPTION A - CRÉER DES PRODUITS ÉLIGIBLES DE TEST' as info;

-- Insérer des produits éligibles de test (à décommenter si nécessaire)
/*
INSERT INTO "ClientProduitEligible" (
    id,
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    priorite,
    current_step,
    progress,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'b4112dad-3e30-4335-968c-802baccbbb0f',
    (SELECT id FROM "ProduitEligible" WHERE nom = 'TICPE' LIMIT 1),
    'eligible',
    0.02,
    25000,
    12,
    1,
    1,
    0,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'b4112dad-3e30-4335-968c-802baccbbb0f',
    (SELECT id FROM "ProduitEligible" WHERE nom = 'CIR' LIMIT 1),
    'eligible',
    0.30,
    15000,
    24,
    2,
    1,
    0,
    NOW(),
    NOW()
);
*/

-- Option B: Rediriger le client vers le simulateur
SELECT 'OPTION B - REDIRECTION VERS SIMULATEUR' as info;

-- Cette option nécessite une modification côté client pour détecter les clients sans produits
-- et les rediriger automatiquement vers le simulateur

-- Option C: Supprimer le client de test
SELECT 'OPTION C - SUPPRESSION CLIENT DE TEST' as info;

-- Si c'est un client de test, on peut le supprimer
/*
DELETE FROM "Client" WHERE email = 'transport.dupont.2025.unique@test.fr';
*/

-- 5. Recommandation
SELECT 'RECOMMANDATION' as info;

SELECT 
    'RECOMMANDATION' as type,
    'Le client transport.dupont.2025.unique@test.fr n a pas de produits éligibles.' as description,
    'Cela peut causer une redirection vers l admin car le dashboard client est vide.' as cause,
    'Solution: Créer des produits éligibles de test ou rediriger vers le simulateur.' as solution;

-- 6. Vérification post-correction
SELECT 'VÉRIFICATION POST-CORRECTION' as info;

-- Après avoir appliqué une correction, vérifier que le client a des produits
SELECT 
    c.id,
    c.email,
    COUNT(cpe.id) as produits_count,
    CASE 
        WHEN COUNT(cpe.id) > 0 THEN 'CORRIGÉ'
        ELSE 'ENCORE PROBLÉMATIQUE'
    END as statut
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email = 'transport.dupont.2025.unique@test.fr'
GROUP BY c.id, c.email; 