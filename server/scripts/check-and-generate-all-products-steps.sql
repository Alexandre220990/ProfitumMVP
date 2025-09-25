-- ============================================================================
-- VÉRIFICATION ET GÉNÉRATION DES ÉTAPES POUR TOUS LES PRODUITS
-- ============================================================================

-- 1. Vérifier tous les produits d'Alexandre Grandjean
SELECT 
    'TOUS_PRODUITS' as check_type,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    c.name as client_name,
    c.email
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'grandjean.laporte@gmail.com'
ORDER BY pe.nom;

-- 2. Vérifier les étapes existantes pour chaque produit
SELECT 
    'ETAPES_EXISTANTES' as check_type,
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

-- 3. Générer les étapes pour tous les produits qui n'en ont pas
DO $$
DECLARE
    produit_record RECORD;
    steps_generated INTEGER := 0;
BEGIN
    FOR produit_record IN 
        SELECT 
            cpe.id as dossier_id,
            cpe."clientId",
            cpe."produitId",
            pe.nom as produit_nom,
            c.name as client_name,
            COUNT(ds.id) as nombre_etapes
        FROM "ClientProduitEligible" cpe
        JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
        JOIN "Client" c ON cpe."clientId" = c.id
        LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
        WHERE c.email = 'grandjean.laporte@gmail.com'
        GROUP BY cpe.id, cpe."clientId", cpe."produitId", pe.nom, c.name
        HAVING COUNT(ds.id) = 0
    LOOP
        RAISE NOTICE 'Génération des étapes pour le produit % (dossier: %)', produit_record.produit_nom, produit_record.dossier_id;
        
        -- Générer les 6 étapes standardisées
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
            produit_record.dossier_id,
            produit_record.produit_nom || ' - ' || produit_record.client_name,
            'Confirmer l''éligibilité',
            'validation',
            (NOW() + INTERVAL '2 days')::timestamptz,
            'in_progress',
            'critical',
            25,
            60,
            'client',
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        ),
        (
            produit_record.dossier_id,
            produit_record.produit_nom || ' - ' || produit_record.client_name,
            'Sélection de l''expert',
            'expertise',
            (NOW() + INTERVAL '4 days')::timestamptz,
            'pending',
            'high',
            0,
            120,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        ),
        (
            produit_record.dossier_id,
            produit_record.produit_nom || ' - ' || produit_record.client_name,
            'Collecte des documents',
            'documentation',
            (NOW() + INTERVAL '6 days')::timestamptz,
            'pending',
            'high',
            0,
            120,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        ),
        (
            produit_record.dossier_id,
            produit_record.produit_nom || ' - ' || produit_record.client_name,
            'Audit technique',
            'expertise',
            (NOW() + INTERVAL '8 days')::timestamptz,
            'pending',
            'critical',
            0,
            240,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        ),
        (
            produit_record.dossier_id,
            produit_record.produit_nom || ' - ' || produit_record.client_name,
            'Validation finale',
            'approval',
            (NOW() + INTERVAL '10 days')::timestamptz,
            'pending',
            'high',
            0,
            60,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        ),
        (
            produit_record.dossier_id,
            produit_record.produit_nom || ' - ' || produit_record.client_name,
            'Demande de remboursement',
            'payment',
            (NOW() + INTERVAL '12 days')::timestamptz,
            'pending',
            'medium',
            0,
            120,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        
        -- Mettre à jour le progress du dossier
        UPDATE "ClientProduitEligible"
        SET 
            current_step = 1,
            progress = 25,
            updated_at = NOW()
        WHERE id = produit_record.dossier_id;
        
        steps_generated := steps_generated + 1;
        RAISE NOTICE '✅ Étapes générées pour % (dossier: %)', produit_record.produit_nom, produit_record.dossier_id;
    END LOOP;
    
    RAISE NOTICE '🎯 Génération terminée: % produits traités', steps_generated;
END $$;

-- 4. Corriger le progress du dossier TICPE (doit être 25 au lieu de 0)
UPDATE "ClientProduitEligible"
SET 
    progress = 25,
    updated_at = NOW()
WHERE id IN (
    SELECT cpe.id
    FROM "ClientProduitEligible" cpe
    JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
    JOIN "Client" c ON cpe."clientId" = c.id
    WHERE c.email = 'grandjean.laporte@gmail.com'
    AND pe.nom ILIKE '%TICPE%'
    AND cpe.progress = 0
);

-- 5. Vérification finale après génération
SELECT 
    'VERIFICATION_FINALE_COMPLETE' as check_type,
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

-- 6. Détail complet de tous les produits
SELECT 
    'DETAIL_COMPLET' as check_type,
    pe.nom as produit,
    ds.step_name,
    ds.step_type,
    ds.status,
    ds.priority,
    ds.progress,
    ds.due_date
FROM "DossierStep" ds
JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
JOIN "Client" c ON cpe."clientId" = c.id
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.email = 'grandjean.laporte@gmail.com'
ORDER BY pe.nom, ds.due_date;
