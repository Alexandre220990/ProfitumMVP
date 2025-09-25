-- ============================================================================
-- SCRIPT DE GÉNÉRATION MANUELLE DES ÉTAPES POUR LE DOSSIER PROBLÉMATIQUE
-- ============================================================================

-- 1. Vérifier que le dossier existe
SELECT 
    'DOSSIER_CHECK' as check_type,
    id,
    "clientId",
    statut,
    current_step,
    progress,
    created_at
FROM "ClientProduitEligible" 
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 2. Récupérer les informations du produit
SELECT 
    'PRODUIT_INFO' as check_type,
    pe.id,
    pe.nom,
    pe.description,
    pe.category
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe.id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 3. Récupérer les informations du client
SELECT 
    'CLIENT_INFO' as check_type,
    c.id,
    c.name,
    c.company_name,
    c.email
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE cpe.id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 4. Générer les étapes TICPE pour ce dossier
INSERT INTO "DossierStep" (
    dossier_id,
    dossier_name,
    step_name,
    step_type,
    due_date,
    status,
    priority,
    progress,
    estimated_duration_minutes,
    assignee_type,
    metadata
) VALUES 
(
    '93374842-cca6-4873-b16e-0ada92e97004',
    'TICPE - ALEXANDRE GRANDJEAN',
    'Confirmer l''éligibilité',
    'validation',
    (NOW() + INTERVAL '2 days')::timestamptz,
    'in_progress',
    'critical',
    25,
    60,
    'client',
    jsonb_build_object('product_type', 'TICPE', 'generated_at', NOW()::text)
),
(
    '93374842-cca6-4873-b16e-0ada92e97004',
    'TICPE - ALEXANDRE GRANDJEAN',
    'Sélection de l''expert',
    'expertise',
    (NOW() + INTERVAL '4 days')::timestamptz,
    'pending',
    'high',
    0,
    120,
    NULL,
    jsonb_build_object('product_type', 'TICPE', 'generated_at', NOW()::text)
),
(
    '93374842-cca6-4873-b16e-0ada92e97004',
    'TICPE - ALEXANDRE GRANDJEAN',
    'Collecte des documents',
    'documentation',
    (NOW() + INTERVAL '6 days')::timestamptz,
    'pending',
    'high',
    0,
    120,
    NULL,
    jsonb_build_object('product_type', 'TICPE', 'generated_at', NOW()::text)
),
(
    '93374842-cca6-4873-b16e-0ada92e97004',
    'TICPE - ALEXANDRE GRANDJEAN',
    'Audit technique',
    'expertise',
    (NOW() + INTERVAL '8 days')::timestamptz,
    'pending',
    'critical',
    0,
    240,
    NULL,
    jsonb_build_object('product_type', 'TICPE', 'generated_at', NOW()::text)
),
(
    '93374842-cca6-4873-b16e-0ada92e97004',
    'TICPE - ALEXANDRE GRANDJEAN',
    'Validation finale',
    'approval',
    (NOW() + INTERVAL '10 days')::timestamptz,
    'pending',
    'high',
    0,
    60,
    NULL,
    jsonb_build_object('product_type', 'TICPE', 'generated_at', NOW()::text)
),
(
    '93374842-cca6-4873-b16e-0ada92e97004',
    'TICPE - ALEXANDRE GRANDJEAN',
    'Demande de remboursement',
    'payment',
    (NOW() + INTERVAL '12 days')::timestamptz,
    'pending',
    'medium',
    0,
    120,
    NULL,
    jsonb_build_object('product_type', 'TICPE', 'generated_at', NOW()::text)
);

-- 5. Vérifier que les étapes ont été créées
SELECT 
    'ETAPES_CREEES' as check_type,
    COUNT(*) as total_etapes,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as etapes_en_attente
FROM "DossierStep"
WHERE dossier_id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 6. Mettre à jour le progress du dossier
UPDATE "ClientProduitEligible"
SET 
    current_step = 1,
    progress = 25,
    updated_at = NOW()
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 7. Vérification finale
SELECT 
    'VERIFICATION_FINALE' as check_type,
    cpe.id,
    cpe.current_step,
    cpe.progress,
    COUNT(ds.id) as nombre_etapes
FROM "ClientProduitEligible" cpe
LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
WHERE cpe.id = '93374842-cca6-4873-b16e-0ada92e97004'
GROUP BY cpe.id, cpe.current_step, cpe.progress;
