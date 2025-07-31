-- =====================================================
-- CORRECTION BASE DE PRODUCTION - wamuchacha@gmail.com
-- Date: 2025-01-30
-- À exécuter sur la base de production Railway
-- =====================================================

-- 1. VÉRIFIER L'UTILISATEUR
SELECT 'VÉRIFICATION UTILISATEUR' as section, 
       id, email, created_at 
FROM auth.users 
WHERE email = 'wamuchacha@gmail.com';

-- 2. VÉRIFIER LE CLIENT
SELECT 'VÉRIFICATION CLIENT' as section,
       id, email, auth_id, name, company_name, created_at
FROM "Client" 
WHERE email = 'wamuchacha@gmail.com';

-- 3. SUPPRIMER LES CONFLITS ADMIN SI EXISTANTS
DELETE FROM "Admin" WHERE email = 'wamuchacha@gmail.com';

-- 4. CRÉER LE CLIENT SI MANQUANT
INSERT INTO "Client" (
    id,
    email,
    auth_id,
    name,
    company_name,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'wamuchacha@gmail.com',
    au.id,
    'Client Test',
    'Entreprise Test',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'wamuchacha@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM "Client" c WHERE c.email = 'wamuchacha@gmail.com'
);

-- 5. CRÉER LES PRODUITS ÉLIGIBLES DE TEST
INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    metadata,
    notes,
    priorite,
    created_at,
    updated_at
)
SELECT 
    c.id,
    '32dd9cf8-15e2-4375-86ab-a95158d3ada1', -- TICPE
    'eligible',
    0.85,
    7500.00,
    12,
    '{"source": "production_fix", "confidence_level": "high", "original_percentage": 85}'::jsonb,
    'Produit éligible créé pour test',
    1,
    NOW(),
    NOW()
FROM "Client" c
WHERE c.email = 'wamuchacha@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM "ClientProduitEligible" cpe 
    WHERE cpe."clientId" = c.id 
    AND cpe."produitId" = '32dd9cf8-15e2-4375-86ab-a95158d3ada1'
);

INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    metadata,
    notes,
    priorite,
    created_at,
    updated_at
)
SELECT 
    c.id,
    'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2', -- URSSAF
    'eligible',
    0.70,
    4500.00,
    12,
    '{"source": "production_fix", "confidence_level": "medium", "original_percentage": 70}'::jsonb,
    'Produit éligible créé pour test',
    2,
    NOW(),
    NOW()
FROM "Client" c
WHERE c.email = 'wamuchacha@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM "ClientProduitEligible" cpe 
    WHERE cpe."clientId" = c.id 
    AND cpe."produitId" = 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2'
);

INSERT INTO "ClientProduitEligible" (
    "clientId",
    "produitId",
    statut,
    "tauxFinal",
    "montantFinal",
    "dureeFinale",
    metadata,
    notes,
    priorite,
    created_at,
    updated_at
)
SELECT 
    c.id,
    'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5', -- DFS
    'en_cours',
    0.55,
    3000.00,
    12,
    '{"source": "production_fix", "confidence_level": "medium", "original_percentage": 55}'::jsonb,
    'Produit en cours créé pour test',
    3,
    NOW(),
    NOW()
FROM "Client" c
WHERE c.email = 'wamuchacha@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM "ClientProduitEligible" cpe 
    WHERE cpe."clientId" = c.id 
    AND cpe."produitId" = 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5'
);

-- 6. VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as section,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'wamuchacha@gmail.com') THEN '✅ Utilisateur auth OK'
        ELSE '❌ Utilisateur auth manquant'
    END as auth_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Client" WHERE email = 'wamuchacha@gmail.com') THEN '✅ Client OK'
        ELSE '❌ Client manquant'
    END as client_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Admin" WHERE email = 'wamuchacha@gmail.com') THEN '⚠️ CONFLIT ADMIN!'
        ELSE '✅ Pas de conflit admin'
    END as admin_conflict,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "ClientProduitEligible" cpe JOIN "Client" c ON cpe."clientId" = c.id WHERE c.email = 'wamuchacha@gmail.com') THEN '✅ Produits éligibles OK'
        ELSE '❌ Aucun produit éligible'
    END as produits_status;

-- 7. AFFICHER LES PRODUITS CRÉÉS
SELECT 
    'PRODUITS CRÉÉS' as section,
    cpe.id,
    cpe."produitId",
    pe.nom as produit_nom,
    cpe.statut,
    cpe."tauxFinal",
    ROUND((cpe."tauxFinal" * 100)::numeric, 0) as taux_pourcentage,
    cpe."montantFinal",
    cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.email = 'wamuchacha@gmail.com'
ORDER BY cpe.created_at DESC; 