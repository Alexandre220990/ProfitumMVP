-- ============================================================================
-- GÉNÉRATION DES ÉTAPES MANQUANTES POUR TOUS LES PRODUITS
-- ============================================================================

-- 1. Identifier tous les produits sans étapes
WITH produits_sans_etapes AS (
    SELECT 
        cpe.id as dossier_id,
        cpe."clientId",
        cpe."produitId",
        cpe.statut,
        cpe.current_step,
        cpe.progress,
        pe.nom as produit_nom,
        c.name as client_name
    FROM "ClientProduitEligible" cpe
    JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
    JOIN "Client" c ON cpe."clientId" = c.id
    WHERE c.email = 'grandjean.laporte@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM "DossierStep" ds 
        WHERE ds.dossier_id = cpe.id
    )
)
SELECT 
    'PRODUITS_SANS_ETAPES' as check_type,
    dossier_id,
    produit_nom,
    statut,
    current_step,
    progress
FROM produits_sans_etapes
ORDER BY produit_nom;

-- 2. Générer les étapes pour tous les produits sans étapes
DO $$
DECLARE
    produit_record RECORD;
    base_date TIMESTAMP WITH TIME ZONE;
    step_count INTEGER;
BEGIN
    -- Parcourir tous les produits sans étapes
    FOR produit_record IN 
        SELECT 
            cpe.id as dossier_id,
            cpe."clientId",
            cpe."produitId",
            cpe.statut,
            pe.nom as produit_nom,
            c.name as client_name
        FROM "ClientProduitEligible" cpe
        JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
        JOIN "Client" c ON cpe."clientId" = c.id
        WHERE c.email = 'grandjean.laporte@gmail.com'
        AND NOT EXISTS (
            SELECT 1 FROM "DossierStep" ds 
            WHERE ds.dossier_id = cpe.id
        )
    LOOP
        RAISE NOTICE 'Génération des étapes pour le produit: %', produit_record.produit_nom;
        
        base_date := NOW();
        step_count := 0;
        
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
            (base_date + INTERVAL '2 days')::timestamptz,
            'in_progress',
            'critical',
            25,
            60,
            'client',
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        step_count := step_count + 1;
        
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
            'Sélection de l''expert',
            'expertise',
            (base_date + INTERVAL '4 days')::timestamptz,
            'pending',
            'high',
            0,
            120,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        step_count := step_count + 1;
        
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
            'Collecte des documents',
            'documentation',
            (base_date + INTERVAL '6 days')::timestamptz,
            'pending',
            'high',
            0,
            120,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        step_count := step_count + 1;
        
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
            'Audit technique',
            'expertise',
            (base_date + INTERVAL '8 days')::timestamptz,
            'pending',
            'critical',
            0,
            240,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        step_count := step_count + 1;
        
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
            'Validation finale',
            'approval',
            (base_date + INTERVAL '10 days')::timestamptz,
            'pending',
            'high',
            0,
            60,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        step_count := step_count + 1;
        
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
            'Demande de remboursement',
            'payment',
            (base_date + INTERVAL '12 days')::timestamptz,
            'pending',
            'medium',
            0,
            120,
            NULL,
            jsonb_build_object('product_type', produit_record.produit_nom, 'generated_at', NOW()::text)
        );
        step_count := step_count + 1;
        
        -- Mettre à jour le progress du dossier
        UPDATE "ClientProduitEligible"
        SET 
            current_step = 1,
            progress = 25,
            updated_at = NOW()
        WHERE id = produit_record.dossier_id;
        
        RAISE NOTICE '✅ % étapes générées pour le produit: %', step_count, produit_record.produit_nom;
    END LOOP;
END $$;

-- 3. Vérification finale de tous les produits
SELECT 
    'VERIFICATION_FINALE' as check_type,
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
