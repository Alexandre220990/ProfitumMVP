-- ============================================================================
-- VÉRIFICATION ET GÉNÉRATION DES ÉTAPES URSSAF POUR ALEXANDRE GRANDJEAN
-- ============================================================================

-- 1. Vérifier si le dossier URSSAF existe pour Alexandre Grandjean
SELECT 
    'DOSSIER_URSSAF_CHECK' as check_type,
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
AND pe.nom ILIKE '%URSSAF%';

-- 2. Vérifier si des étapes existent déjà pour ce dossier
SELECT 
    'ETAPES_URSSAF_CHECK' as check_type,
    COUNT(*) as nombre_etapes,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as etapes_en_attente,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as etapes_terminees
FROM "DossierStep" ds
JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'grandjean.laporte@gmail.com'
AND EXISTS (
    SELECT 1 FROM "ProduitEligible" pe 
    WHERE pe.id = cpe."produitId" 
    AND pe.nom ILIKE '%URSSAF%'
);

-- 3. Si le dossier existe mais n'a pas d'étapes, les générer
DO $$
DECLARE
    urssaf_dossier_id UUID;
    urssaf_dossier_exists BOOLEAN := FALSE;
    etapes_existent BOOLEAN := FALSE;
BEGIN
    -- Récupérer l'ID du dossier URSSAF d'Alexandre Grandjean
    SELECT cpe.id INTO urssaf_dossier_id
    FROM "ClientProduitEligible" cpe
    JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
    JOIN "Client" c ON cpe."clientId" = c.id
    WHERE c.email = 'grandjean.laporte@gmail.com' 
    AND pe.nom ILIKE '%URSSAF%'
    LIMIT 1;
    
    IF urssaf_dossier_id IS NOT NULL THEN
        urssaf_dossier_exists := TRUE;
        
        -- Vérifier si des étapes existent déjà
        SELECT EXISTS (
            SELECT 1 FROM "DossierStep" 
            WHERE dossier_id = urssaf_dossier_id
        ) INTO etapes_existent;
        
        -- Si le dossier existe mais n'a pas d'étapes, les générer
        IF urssaf_dossier_exists AND NOT etapes_existent THEN
            RAISE NOTICE 'Génération des étapes URSSAF pour le dossier: %', urssaf_dossier_id;
            
            -- Générer les étapes URSSAF
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
                urssaf_dossier_id,
                'URSSAF - ALEXANDRE GRANDJEAN',
                'Confirmer l''éligibilité URSSAF',
                'validation',
                (NOW() + INTERVAL '2 days')::timestamptz,
                'in_progress',
                'critical',
                25,
                60,
                'client',
                jsonb_build_object('product_type', 'URSSAF', 'generated_at', NOW()::text)
            ),
            (
                urssaf_dossier_id,
                'URSSAF - ALEXANDRE GRANDJEAN',
                'Sélection de l''expert URSSAF',
                'expertise',
                (NOW() + INTERVAL '4 days')::timestamptz,
                'pending',
                'high',
                0,
                120,
                NULL,
                jsonb_build_object('product_type', 'URSSAF', 'generated_at', NOW()::text)
            ),
            (
                urssaf_dossier_id,
                'URSSAF - ALEXANDRE GRANDJEAN',
                'Collecte des documents URSSAF',
                'documentation',
                (NOW() + INTERVAL '6 days')::timestamptz,
                'pending',
                'high',
                0,
                120,
                NULL,
                jsonb_build_object('product_type', 'URSSAF', 'generated_at', NOW()::text)
            ),
            (
                urssaf_dossier_id,
                'URSSAF - ALEXANDRE GRANDJEAN',
                'Audit URSSAF',
                'expertise',
                (NOW() + INTERVAL '8 days')::timestamptz,
                'pending',
                'critical',
                0,
                240,
                NULL,
                jsonb_build_object('product_type', 'URSSAF', 'generated_at', NOW()::text)
            ),
            (
                urssaf_dossier_id,
                'URSSAF - ALEXANDRE GRANDJEAN',
                'Validation finale URSSAF',
                'approval',
                (NOW() + INTERVAL '10 days')::timestamptz,
                'pending',
                'high',
                0,
                60,
                NULL,
                jsonb_build_object('product_type', 'URSSAF', 'generated_at', NOW()::text)
            ),
            (
                urssaf_dossier_id,
                'URSSAF - ALEXANDRE GRANDJEAN',
                'Demande de remboursement URSSAF',
                'payment',
                (NOW() + INTERVAL '12 days')::timestamptz,
                'pending',
                'medium',
                0,
                120,
                NULL,
                jsonb_build_object('product_type', 'URSSAF', 'generated_at', NOW()::text)
            );
            
            -- Mettre à jour le progress du dossier
            UPDATE "ClientProduitEligible"
            SET 
                current_step = 1,
                progress = 25,
                updated_at = NOW()
            WHERE id = urssaf_dossier_id;
            
            RAISE NOTICE '✅ Étapes URSSAF générées avec succès pour le dossier: %', urssaf_dossier_id;
        ELSE
            IF urssaf_dossier_exists AND etapes_existent THEN
                RAISE NOTICE 'ℹ️ Le dossier URSSAF existe déjà avec des étapes: %', urssaf_dossier_id;
            ELSE
                RAISE NOTICE '⚠️ Aucun dossier URSSAF trouvé pour Alexandre Grandjean';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Aucun dossier URSSAF trouvé pour Alexandre Grandjean';
    END IF;
END $$;

-- 4. Vérification finale
SELECT 
    'VERIFICATION_FINALE_URSSAF' as check_type,
    cpe.id,
    cpe.current_step,
    cpe.progress,
    COUNT(ds.id) as nombre_etapes,
    COUNT(CASE WHEN ds.status = 'in_progress' THEN 1 END) as etapes_en_cours,
    COUNT(CASE WHEN ds.status = 'pending' THEN 1 END) as etapes_en_attente
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
WHERE c.email = 'grandjean.laporte@gmail.com' 
AND pe.nom ILIKE '%URSSAF%'
GROUP BY cpe.id, cpe.current_step, cpe.progress;
