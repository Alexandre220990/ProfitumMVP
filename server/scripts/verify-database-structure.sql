-- Script de vérification de la structure de la base de données
-- Pour l'enregistrement des ClientProduitEligible

-- 1. Vérifier la structure de la table ClientProduitEligible
SELECT 
    'ClientProduitEligible' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de la table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'ClientProduitEligible'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'ClientProduitEligible'
ORDER BY policyname;

-- 4. Vérifier les permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
ORDER BY grantee, privilege_type;

-- 5. Vérifier les données existantes
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT "clientId") as unique_clients,
    COUNT(DISTINCT "produitId") as unique_products
FROM "ClientProduitEligible";

-- 6. Vérifier les produits éligibles disponibles
SELECT 
    id,
    nom,
    categorie,
    active,
    created_at
FROM "ProduitEligible"
ORDER BY nom;

-- 7. Vérifier les clients de test
SELECT 
    id,
    email,
    username,
    created_at
FROM "Client"
WHERE email LIKE '%test%' OR email LIKE '%migration%'
ORDER BY created_at DESC;

-- 8. Vérifier les sessions temporaires
SELECT 
    id,
    session_token,
    migrated_to_account,
    migrated_at,
    created_at,
    expires_at
FROM "TemporarySession"
ORDER BY created_at DESC
LIMIT 10;

-- 9. Vérifier les résultats d'éligibilité temporaires
SELECT 
    id,
    session_id,
    produit_id,
    eligibility_score,
    estimated_savings,
    created_at
FROM "TemporaryEligibility"
ORDER BY created_at DESC
LIMIT 10;

-- 10. Vérifier les dernières insertions ClientProduitEligible
SELECT 
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
    created_at
FROM "ClientProduitEligible"
ORDER BY created_at DESC
LIMIT 10;

-- 11. Vérifier les métadonnées des produits éligibles
SELECT 
    id,
    "clientId",
    "produitId",
    metadata,
    notes,
    created_at
FROM "ClientProduitEligible"
WHERE metadata IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 12. Vérifier les statistiques par produit
SELECT 
    pe.nom as produit_nom,
    COUNT(cpe.id) as nombre_eligibilites,
    AVG(cpe."tauxFinal") as taux_moyen,
    AVG(cpe."montantFinal") as montant_moyen,
    COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as eligibles,
    COUNT(CASE WHEN cpe.statut = 'non_eligible' THEN 1 END) as non_eligibles
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
GROUP BY pe.id, pe.nom
ORDER BY nombre_eligibilites DESC; 