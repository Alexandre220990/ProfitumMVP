-- ============================================================================
-- CORRECTION DES DOUBLONS ET STANDARDISATION DES ÉTAPES
-- ============================================================================

-- 1. NETTOYAGE DES DOUBLONS TICPE
-- Supprimer les étapes en double du dossier TICPE (garder les plus récentes)
DELETE FROM "DossierStep" 
WHERE id IN (
    SELECT ds.id
    FROM "DossierStep" ds
    JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
    JOIN "Client" c ON cpe."clientId" = c.id
    WHERE c.email = 'grandjean.laporte@gmail.com'
    AND EXISTS (
        SELECT 1 FROM "ProduitEligible" pe 
        WHERE pe.id = cpe."produitId" 
        AND pe.nom ILIKE '%TICPE%'
    )
    AND ds.created_at < (
        SELECT MAX(created_at) 
        FROM "DossierStep" ds2 
        WHERE ds2.dossier_id = ds.dossier_id
    )
);

-- 2. SUPPRESSION DES ÉTAPES URSSAF ACTUELLES (mauvaises étapes)
DELETE FROM "DossierStep" 
WHERE dossier_id IN (
    SELECT cpe.id
    FROM "ClientProduitEligible" cpe
    JOIN "Client" c ON cpe."clientId" = c.id
    WHERE c.email = 'grandjean.laporte@gmail.com'
    AND EXISTS (
        SELECT 1 FROM "ProduitEligible" pe 
        WHERE pe.id = cpe."produitId" 
        AND pe.nom ILIKE '%URSSAF%'
    )
);

-- 3. GÉNÉRATION DES ÉTAPES URSSAF STANDARDISÉES
DO $$
DECLARE
    urssaf_dossier_id UUID;
BEGIN
    -- Récupérer l'ID du dossier URSSAF
    SELECT cpe.id INTO urssaf_dossier_id
    FROM "ClientProduitEligible" cpe
    JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
    JOIN "Client" c ON cpe."clientId" = c.id
    WHERE c.email = 'grandjean.laporte@gmail.com' 
    AND pe.nom ILIKE '%URSSAF%'
    LIMIT 1;
    
    IF urssaf_dossier_id IS NOT NULL THEN
        -- Générer les étapes URSSAF standardisées (mêmes que TICPE)
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
            'Confirmer l''éligibilité',
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
            'Sélection de l''expert',
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
            'Collecte des documents',
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
            'Audit technique',
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
            'Validation finale',
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
            'Demande de remboursement',
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
        
        RAISE NOTICE '✅ Étapes URSSAF standardisées générées pour le dossier: %', urssaf_dossier_id;
    END IF;
END $$;

-- 4. VÉRIFICATION FINALE
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
AND pe.nom IN ('TICPE', 'URSSAF')
GROUP BY pe.nom, cpe.progress
ORDER BY pe.nom;

-- 5. DÉTAIL DES ÉTAPES APRÈS CORRECTION
SELECT 
    'DETAIL_APRES_CORRECTION' as check_type,
    pe.nom as produit,
    ds.step_name,
    ds.step_type,
    ds.status,
    ds.priority,
    ds.progress
FROM "DossierStep" ds
JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
JOIN "Client" c ON cpe."clientId" = c.id
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.email = 'grandjean.laporte@gmail.com'
AND pe.nom IN ('TICPE', 'URSSAF')
ORDER BY pe.nom, ds.due_date;
