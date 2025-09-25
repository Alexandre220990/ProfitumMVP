-- ============================================================================
-- SCRIPT DE GÉNÉRATION AUTOMATIQUE DES ÉTAPES POUR TOUS LES DOSSIERS
-- ============================================================================

-- 1. Identifier tous les dossiers sans étapes
SELECT 
    'DOSSIERS_SANS_ETAPES' as check_type,
    cpe.id,
    cpe."clientId",
    cpe.statut,
    cpe.current_step,
    cpe.progress,
    pe.nom as produit_nom,
    c.name as client_name
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
JOIN "Client" c ON cpe."clientId" = c.id
WHERE cpe.statut IN ('eligible', 'en_cours', 'termine')
AND NOT EXISTS (
    SELECT 1 FROM "DossierStep" ds 
    WHERE ds.dossier_id = cpe.id
);

-- 2. Fonction pour générer les étapes selon le type de produit
CREATE OR REPLACE FUNCTION generate_steps_for_dossier(dossier_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    dossier_record RECORD;
    produit_record RECORD;
    client_record RECORD;
    step_config JSONB;
    step_data JSONB;
    step_count INTEGER := 0;
BEGIN
    -- Récupérer les informations du dossier
    SELECT * INTO dossier_record
    FROM "ClientProduitEligible"
    WHERE id = dossier_uuid;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Dossier % non trouvé', dossier_uuid;
        RETURN FALSE;
    END IF;
    
    -- Récupérer les informations du produit
    SELECT * INTO produit_record
    FROM "ProduitEligible"
    WHERE id = dossier_record."produitId";
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Produit non trouvé pour le dossier %', dossier_uuid;
        RETURN FALSE;
    END IF;
    
    -- Récupérer les informations du client
    SELECT * INTO client_record
    FROM "Client"
    WHERE id = dossier_record."clientId";
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Client non trouvé pour le dossier %', dossier_uuid;
        RETURN FALSE;
    END IF;
    
    -- Configuration des étapes selon le produit
    CASE produit_record.nom
        WHEN 'TICPE' THEN
            step_config := '[
                {"name": "Confirmer l''éligibilité", "type": "validation", "priority": "critical", "duration": 60},
                {"name": "Sélection de l''expert", "type": "expert_selection", "priority": "high", "duration": 120},
                {"name": "Collecte des documents", "type": "documentation", "priority": "high", "duration": 120},
                {"name": "Audit technique", "type": "expertise", "priority": "critical", "duration": 240},
                {"name": "Validation finale", "type": "approval", "priority": "high", "duration": 60},
                {"name": "Demande de remboursement", "type": "payment", "priority": "medium", "duration": 120}
            ]'::JSONB;
        WHEN 'CIR' THEN
            step_config := '[
                {"name": "Vérification des critères", "type": "validation", "priority": "high", "duration": 90},
                {"name": "Analyse des dépenses", "type": "documentation", "priority": "critical", "duration": 180},
                {"name": "Expertise comptable", "type": "expertise", "priority": "critical", "duration": 300},
                {"name": "Validation administrative", "type": "approval", "priority": "high", "duration": 90},
                {"name": "Déclaration fiscale", "type": "payment", "priority": "medium", "duration": 120}
            ]'::JSONB;
        WHEN 'URSSAF' THEN
            step_config := '[
                {"name": "Audit des cotisations", "type": "validation", "priority": "high", "duration": 120},
                {"name": "Analyse des erreurs", "type": "documentation", "priority": "critical", "duration": 180},
                {"name": "Expertise sociale", "type": "expertise", "priority": "critical", "duration": 240},
                {"name": "Validation URSSAF", "type": "approval", "priority": "high", "duration": 90},
                {"name": "Remboursement", "type": "payment", "priority": "medium", "duration": 120}
            ]'::JSONB;
        WHEN 'DFS' THEN
            step_config := '[
                {"name": "Vérification des conditions", "type": "validation", "priority": "high", "duration": 90},
                {"name": "Collecte des justificatifs", "type": "documentation", "priority": "high", "duration": 120},
                {"name": "Expertise formation", "type": "expertise", "priority": "critical", "duration": 180},
                {"name": "Validation OPCO", "type": "approval", "priority": "high", "duration": 90},
                {"name": "Versement des fonds", "type": "payment", "priority": "medium", "duration": 120}
            ]'::JSONB;
        ELSE
            step_config := '[
                {"name": "Validation initiale", "type": "validation", "priority": "high", "duration": 60},
                {"name": "Documentation requise", "type": "documentation", "priority": "high", "duration": 120},
                {"name": "Expertise technique", "type": "expertise", "priority": "critical", "duration": 240}
            ]'::JSONB;
    END CASE;
    
    -- Générer les étapes
    FOR i IN 0..(jsonb_array_length(step_config) - 1) LOOP
        step_data := step_config->i;
        
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
        ) VALUES (
            dossier_uuid,
            produit_record.nom || ' - ' || COALESCE(client_record.company_name, client_record.name, 'Client'),
            step_data->>'name',
            step_data->>'type',
            (NOW() + (i * 2 || ' days')::INTERVAL)::timestamptz,
            CASE WHEN i = 0 THEN 'in_progress' ELSE 'pending' END,
            step_data->>'priority',
            CASE WHEN i = 0 THEN 25 ELSE 0 END,
            (step_data->>'duration')::INTEGER,
            CASE WHEN i = 0 THEN 'client' ELSE NULL END,
            jsonb_build_object(
                'product_type', produit_record.nom,
                'montant_final', dossier_record."montantFinal",
                'generated_at', NOW()::text
            )
        );
        
        step_count := step_count + 1;
    END LOOP;
    
    -- Mettre à jour le progress du dossier
    UPDATE "ClientProduitEligible"
    SET 
        current_step = 1,
        progress = 25,
        updated_at = NOW()
    WHERE id = dossier_uuid;
    
    RAISE NOTICE 'Généré % étapes pour le dossier %', step_count, dossier_uuid;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la génération des étapes pour le dossier %: %', dossier_uuid, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 3. Générer les étapes pour tous les dossiers éligibles sans étapes
DO $$
DECLARE
    dossier_record RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    FOR dossier_record IN 
        SELECT cpe.id
        FROM "ClientProduitEligible" cpe
        WHERE cpe.statut IN ('eligible', 'en_cours', 'termine')
        AND NOT EXISTS (
            SELECT 1 FROM "DossierStep" ds 
            WHERE ds.dossier_id = cpe.id
        )
    LOOP
        IF generate_steps_for_dossier(dossier_record.id) THEN
            success_count := success_count + 1;
        ELSE
            error_count := error_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Génération terminée: % succès, % erreurs', success_count, error_count;
END $$;

-- 4. Vérification finale
SELECT 
    'VERIFICATION_FINALE' as check_type,
    COUNT(*) as total_dossiers,
    COUNT(CASE WHEN ds.id IS NOT NULL THEN 1 END) as dossiers_avec_etapes,
    COUNT(CASE WHEN ds.id IS NULL THEN 1 END) as dossiers_sans_etapes,
    AVG(cpe.progress) as progress_moyen
FROM "ClientProduitEligible" cpe
LEFT JOIN "DossierStep" ds ON cpe.id = ds.dossier_id
WHERE cpe.statut IN ('eligible', 'en_cours', 'termine')
GROUP BY ds.id IS NULL;

-- 5. Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS generate_steps_for_dossier(UUID);
