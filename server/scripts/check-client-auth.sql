-- =====================================================
-- VÉRIFICATION AUTHENTIFICATION CLIENT
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier le client dans la table Client
SELECT 
    id,
    email,
    name,
    company_name,
    auth_id,
    type,
    statut,
    "dateCreation"
FROM "Client" 
WHERE email = 'transport.dupont.2025.unique@test.fr'
ORDER BY "dateCreation" DESC;

-- 2. Vérifier si un compte Auth existe pour cet email
-- Note: Cette requête nécessite des privilèges admin sur auth.users
-- SELECT 
--     id,
--     email,
--     user_metadata,
--     created_at
-- FROM auth.users 
-- WHERE email = 'transport.dupont.2025.unique@test.fr';

-- 3. Vérifier les produits éligibles du client
SELECT 
    cpe.id,
    cpe."clientId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    pe.nom as produit_nom,
    cpe."created_at"
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe."clientId" IN (
    SELECT id FROM "Client" 
    WHERE email = 'transport.dupont.2025.unique@test.fr'
)
ORDER BY cpe."created_at" DESC;

-- 4. Compter les produits éligibles par statut
SELECT 
    c.email,
    c.name,
    COUNT(cpe.id) as total_produits,
    COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as produits_eligibles,
    COUNT(CASE WHEN cpe.statut = 'en_cours' THEN 1 END) as produits_en_cours,
    COUNT(CASE WHEN cpe.statut = 'non_eligible' THEN 1 END) as produits_non_eligibles
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email = 'transport.dupont.2025.unique@test.fr'
GROUP BY c.id, c.email, c.name; 