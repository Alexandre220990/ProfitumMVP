-- ============================================================================
-- VÉRIFICATION DE TOUS LES PRODUITS ET ASSIGNATIONS UTILISATEUR
-- ============================================================================

-- 1. Vérifier tous les produits disponibles dans ProduitEligible
SELECT 
    'PRODUITS_DISPONIBLES' as check_type,
    id,
    nom,
    description,
    category,
    active
FROM "ProduitEligible"
ORDER BY nom;

-- 2. Vérifier tous les produits attribués à Alexandre Grandjean
SELECT 
    'PRODUITS_ATTRIBUES' as check_type,
    cpe.id as dossier_id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    pe.description as produit_description,
    pe.category as produit_category,
    c.name as client_name,
    c.email
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'grandjean.laporte@gmail.com'
ORDER BY pe.nom;

-- 3. Vérifier les étapes pour chaque produit attribué
SELECT 
    'ETAPES_PAR_PRODUIT' as check_type,
    pe.nom as produit,
    COUNT(ds.id) as nombre_etapes,
    COUNT(CASE WHEN ds.status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN ds.status = 'pending' THEN 1 END) as etapes_en_attente,
    COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) as etapes_terminees,
    cpe.progress as progress_dossier
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
WHERE c.email = 'grandjean.laporte@gmail.com'
GROUP BY pe.nom, cpe.progress
ORDER BY pe.nom;

-- 4. Identifier les produits sans étapes
SELECT 
    'PRODUITS_SANS_ETAPES' as check_type,
    cpe.id as dossier_id,
    pe.nom as produit_nom,
    cpe.statut,
    cpe.current_step,
    cpe.progress
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'grandjean.laporte@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM "DossierStep" ds 
    WHERE ds.dossier_id = cpe.id
)
ORDER BY pe.nom;

-- 5. Comparaison : produits disponibles vs produits attribués
SELECT 
    'COMPARAISON_PRODUITS' as check_type,
    pe.nom as produit_disponible,
    CASE 
        WHEN cpe.id IS NOT NULL THEN 'ATTRIBUÉ'
        ELSE 'NON ATTRIBUÉ'
    END as statut_attribution,
    cpe.statut as statut_dossier,
    cpe.progress as progress_dossier
FROM "ProduitEligible" pe
LEFT JOIN "ClientProduitEligible" cpe ON pe.id = cpe."produitId"
LEFT JOIN "Client" c ON cpe."clientId" = c.id AND c.email = 'grandjean.laporte@gmail.com'
WHERE pe.active = true
ORDER BY pe.nom;
