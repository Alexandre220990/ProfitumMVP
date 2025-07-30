-- =====================================================
-- VÉRIFICATION DES DONNÉES DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier le client créé
SELECT 
    id,
    email,
    name,
    company_name,
    siren,
    type,
    statut,
    "dateCreation",
    metadata
FROM "Client" 
WHERE email = 'transport.dupont.2025.unique@test.fr'
ORDER BY "dateCreation" DESC;

-- 2. Vérifier les produits éligibles du client
SELECT 
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe."dureeFinale",
    cpe."created_at",
    cpe.metadata,
    pe.nom as produit_nom,
    pe.description as produit_description
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe."clientId" IN (
    SELECT id FROM "Client" 
    WHERE email = 'transport.dupont.2025.unique@test.fr'
)
ORDER BY cpe."created_at" DESC;

-- 3. Vérifier la session de simulation
SELECT 
    id,
    session_token,
    status,
    created_at,
    updated_at,
    metadata
FROM "SimulatorSession" 
WHERE session_token = 'ae87168a-1560-4ae7-8ef1-7e88b2d63b6b';

-- 4. Vérifier les éligibilités de simulation
SELECT 
    id,
    session_id,
    produit_id,
    eligibility_score,
    estimated_savings,
    confidence_level,
    created_at
FROM "SimulatorEligibility" 
WHERE session_id IN (
    SELECT id FROM "SimulatorSession" 
    WHERE session_token = 'ae87168a-1560-4ae7-8ef1-7e88b2d63b6b'
);

-- 5. Compter les produits éligibles par client
SELECT 
    c.email,
    c.name,
    COUNT(cpe.id) as produits_count,
    COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as produits_eligibles,
    COUNT(CASE WHEN cpe.statut = 'en_cours' THEN 1 END) as produits_en_cours,
    COUNT(CASE WHEN cpe.statut = 'non_eligible' THEN 1 END) as produits_non_eligibles
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email LIKE '%transport.dupont.2025.unique%'
GROUP BY c.id, c.email, c.name
ORDER BY c."dateCreation" DESC; 