-- ============================================================================
-- COMPARAISON DES ÉTAPES TICPE ET URSSAF POUR ALEXANDRE GRANDJEAN
-- ============================================================================

-- 1. Vérifier les étapes du dossier TICPE
SELECT 
    'TICPE_ETAPES' as check_type,
    cpe.id,
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    COUNT(ds.id) as nombre_etapes,
    COUNT(CASE WHEN ds.status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN ds.status = 'pending' THEN 1 END) as etapes_en_attente,
    COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) as etapes_terminees
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
WHERE c.email = 'grandjean.laporte@gmail.com' 
AND pe.nom ILIKE '%TICPE%'
GROUP BY cpe.id, cpe.statut, cpe.current_step, cpe.progress, pe.nom;

-- 2. Vérifier les étapes du dossier URSSAF
SELECT 
    'URSSAF_ETAPES' as check_type,
    cpe.id,
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    COUNT(ds.id) as nombre_etapes,
    COUNT(CASE WHEN ds.status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN ds.status = 'pending' THEN 1 END) as etapes_en_attente,
    COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) as etapes_terminees
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
WHERE c.email = 'grandjean.laporte@gmail.com' 
AND pe.nom ILIKE '%URSSAF%'
GROUP BY cpe.id, cpe.statut, cpe.current_step, cpe.progress, pe.nom;

-- 3. Détail des étapes TICPE
SELECT 
    'DETAIL_TICPE' as check_type,
    ds.step_name,
    ds.step_type,
    ds.status,
    ds.priority,
    ds.progress,
    ds.due_date
FROM "DossierStep" ds
JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'grandjean.laporte@gmail.com'
AND EXISTS (
    SELECT 1 FROM "ProduitEligible" pe 
    WHERE pe.id = cpe."produitId" 
    AND pe.nom ILIKE '%TICPE%'
)
ORDER BY ds.due_date;

-- 4. Détail des étapes URSSAF
SELECT 
    'DETAIL_URSSAF' as check_type,
    ds.step_name,
    ds.step_type,
    ds.status,
    ds.priority,
    ds.progress,
    ds.due_date
FROM "DossierStep" ds
JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'grandjean.laporte@gmail.com'
AND EXISTS (
    SELECT 1 FROM "ProduitEligible" pe 
    WHERE pe.id = cpe."produitId" 
    AND pe.nom ILIKE '%URSSAF%'
)
ORDER BY ds.due_date;

-- 5. Comparaison globale
SELECT 
    'COMPARAISON' as check_type,
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
AND pe.nom IN ('TICPE', 'URSSAF')
GROUP BY pe.nom, cpe.progress
ORDER BY pe.nom;
