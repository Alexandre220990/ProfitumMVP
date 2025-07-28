-- Script de test manuel d'insertion ClientProduitEligible
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que le client existe
SELECT 
    id,
    email,
    username
FROM "Client" 
WHERE email = 'test-migration@example.com'
LIMIT 1;

-- 2. Vérifier que le produit existe
SELECT 
    id,
    nom,
    categorie,
    active
FROM "ProduitEligible" 
WHERE id = '32dd9cf8-15e2-4375-86ab-a95158d3ada1'
LIMIT 1;

-- 3. Test d'insertion avec données minimales
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" WHERE email = 'test-migration@example.com' LIMIT 1),
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'eligible',
    0.75,
    4388,
    12,
    NOW(),
    NOW()
) RETURNING *;

-- 4. Test d'insertion avec toutes les colonnes (comme dans le code)
INSERT INTO "ClientProduitEligible" (
    id,
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    "simulationId",
    metadata,
    notes,
    priorite,
    "dateEligibilite",
    current_step,
    progress,
    expert_id,
    charte_signed,
    charte_signed_at,
    "created_at",
    "updated_at"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" WHERE email = 'test-migration@example.com' LIMIT 1),
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'eligible',
    0.75,
    4388,
    12,
    NULL,
    '{"confidence_level": "high", "recommendations": ["Test"], "session_token": "test", "migrated_at": "2025-07-28T10:00:00Z", "original_produit_id": "TICPE"}'::jsonb,
    'Migration depuis simulateur - Score: 75%, Confiance: high',
    2,
    NOW(),
    0,
    0,
    NULL,
    FALSE,
    NULL,
    NOW(),
    NOW()
) RETURNING *;

-- 5. Vérifier les contraintes de validation
-- Test avec tauxFinal invalide
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" WHERE email = 'test-migration@example.com' LIMIT 1),
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'eligible',
    1.5, -- Taux invalide (> 1)
    4388,
    12,
    NOW(),
    NOW()
);

-- 6. Test avec montantFinal invalide
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" WHERE email = 'test-migration@example.com' LIMIT 1),
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'eligible',
    0.75,
    -100, -- Montant invalide (< 0)
    12,
    NOW(),
    NOW()
);

-- 7. Test avec dureeFinale invalide
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" WHERE email = 'test-migration@example.com' LIMIT 1),
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'eligible',
    0.75,
    4388,
    0, -- Durée invalide (<= 0)
    NOW(),
    NOW()
);

-- 8. Test avec statut invalide
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "Client" WHERE email = 'test-migration@example.com' LIMIT 1),
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
    'invalid_status', -- Statut invalide
    0.75,
    4388,
    12,
    NOW(),
    NOW()
); 