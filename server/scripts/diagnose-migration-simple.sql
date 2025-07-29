-- Script de diagnostic simplifié pour le problème de migration
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de base de ClientProduitEligible
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name IN ('id', 'clientId', 'produitId', 'statut', 'tauxFinal', 'montantFinal', 'dureeFinale', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 2. Vérifier les produits éligibles disponibles
SELECT 
    id,
    nom,
    categorie
FROM "ProduitEligible" 
WHERE active = true
ORDER BY nom;

-- 3. Vérifier les sessions temporaires non migrées
SELECT 
    id,
    session_token,
    completed,
    migrated_to_account,
    created_at
FROM "TemporarySession" 
WHERE migrated_to_account = false
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Vérifier les résultats d'éligibilité pour une session récente
SELECT 
    te.produit_id,
    te.eligibility_score,
    te.estimated_savings,
    te.confidence_level,
    ts.session_token
FROM "TemporaryEligibility" te
JOIN "TemporarySession" ts ON te.session_id = ts.id
WHERE ts.migrated_to_account = false
ORDER BY te.created_at DESC 
LIMIT 10;

-- 5. Vérifier les clients récents
SELECT 
    id,
    email,
    username,
    created_at
FROM "Client" 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Vérifier les ClientProduitEligible existants
SELECT 
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe."created_at",
    c.email as client_email,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
ORDER BY cpe."created_at" DESC 
LIMIT 10;

-- 7. Test d'insertion minimal (à décommenter pour tester)
/*
-- Récupérer un client et un produit pour le test
WITH test_data AS (
    SELECT 
        (SELECT id FROM "Client" ORDER BY created_at DESC LIMIT 1) as client_id,
        (SELECT id FROM "ProduitEligible" WHERE nom = 'TICPE' LIMIT 1) as produit_id
)
INSERT INTO "ClientProduitEligible" (
    id,
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    "created_at",
    "updated_at"
)
SELECT 
    gen_random_uuid(),
    client_id,
    produit_id,
    'eligible',
    0.75,
    5000,
    12,
    NOW(),
    NOW()
FROM test_data
RETURNING *;
*/