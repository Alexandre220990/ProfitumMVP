-- Script de correction des problèmes d'authentification
-- À exécuter pour corriger les problèmes identifiés

-- 1. Vérification des experts (NORMAL - workflow d'administration)
SELECT 'VÉRIFICATION EXPERTS - WORKFLOW ADMIN' as info;

SELECT 
    approval_status,
    COUNT(*) as count
FROM "Expert" 
GROUP BY approval_status
ORDER BY approval_status;

-- 2. Vérification des clients sans auth_id
SELECT 'VÉRIFICATION CLIENTS SANS AUTH_ID' as info;

SELECT 
    id, 
    email, 
    auth_id,
    created_at
FROM "Client" 
WHERE auth_id IS NULL;

-- 3. Vérification des doublons d'emails
SELECT 'VÉRIFICATION DOUBLONS EMAILS' as info;

SELECT 
    email, 
    COUNT(*) as count,
    array_agg(id) as client_ids
FROM "Client" 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- 4. Vérification des produits éligibles orphelins
SELECT 'VÉRIFICATION PRODUITS ÉLIGIBLES ORPHELINS' as info;

SELECT 
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe.created_at
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
WHERE c.id IS NULL;

-- 5. Statistiques de correction
SELECT 'STATISTIQUES DE CORRECTION' as info;

SELECT 
    'Clients sans auth_id' as probleme,
    COUNT(*) as count
FROM "Client" 
WHERE auth_id IS NULL

UNION ALL

SELECT 
    'Experts en attente d''approbation' as probleme,
    COUNT(*) as count
FROM "Expert" 
WHERE approval_status = 'pending'

UNION ALL

SELECT 
    'Produits éligibles orphelins' as probleme,
    COUNT(*) as count
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
WHERE c.id IS NULL;

-- 6. Actions de correction recommandées
SELECT 'ACTIONS DE CORRECTION RECOMMANDÉES' as info;

-- Pour corriger les clients sans auth_id (générer des UUID)
-- UPDATE "Client" SET auth_id = gen_random_uuid() WHERE auth_id IS NULL;

-- Pour approuver les experts en attente (via interface admin uniquement)
-- UPDATE "Expert" SET approval_status = 'approved' WHERE approval_status = 'pending';

-- Pour nettoyer les produits éligibles orphelins
-- DELETE FROM "ClientProduitEligible" cpe
-- WHERE NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = cpe."clientId");

-- 7. Vérification post-correction
SELECT 'VÉRIFICATION POST-CORRECTION' as info;

SELECT 
    'Clients avec auth_id' as verification,
    COUNT(*) as count
FROM "Client" 
WHERE auth_id IS NOT NULL

UNION ALL

SELECT 
    'Experts approuvés' as verification,
    COUNT(*) as count
FROM "Expert" 
WHERE approval_status = 'approved'

UNION ALL

SELECT 
    'Experts en attente' as verification,
    COUNT(*) as count
FROM "Expert" 
WHERE approval_status = 'pending'

UNION ALL

SELECT 
    'Produits éligibles valides' as verification,
    COUNT(*) as count
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"; 