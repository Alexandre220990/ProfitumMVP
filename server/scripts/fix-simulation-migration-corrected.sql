-- =====================================================
-- CORRECTION MIGRATION SIMULATION (CORRIGÉ)
-- Date: 2025-01-30
-- =====================================================

-- 1. VÉRIFIER LES SESSIONS SIMULATEUR NON MIGRÉES
SELECT 
    'SESSIONS_NON_MIGREES' as section,
    ss.id,
    ss.session_token,
    ss.status,
    ss.created_at,
    ss.metadata
FROM "SimulatorSession" ss
WHERE ss.status = 'completed' 
   OR ss.status = 'active'
ORDER BY ss.created_at DESC;

-- 2. VÉRIFIER LES ÉLIGIBILITÉS SIMULATEUR
SELECT 
    'ELIGIBILITES_SIMULATEUR' as section,
    se.id,
    se.session_id,
    se.produit_id,
    se.eligibility_score,
    se.estimated_savings,
    se.confidence_level,
    se.created_at
FROM "SimulatorEligibility" se
ORDER BY se.created_at DESC
LIMIT 10;

-- 3. FONCTION POUR MIGRER MANUELLEMENT UNE SESSION (CORRIGÉE)
CREATE OR REPLACE FUNCTION migrate_session_manually_corrected(
    p_session_token text,
    p_client_email text
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    eligibility_record RECORD;
    client_record RECORD;
    migrated_count integer := 0;
    migration_result json;
BEGIN
    -- Récupérer la session
    SELECT * INTO session_record 
    FROM "SimulatorSession" 
    WHERE session_token = p_session_token;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée'
        );
    END IF;
    
    -- Récupérer le client
    SELECT * INTO client_record 
    FROM "Client" 
    WHERE email = p_client_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Client non trouvé'
        );
    END IF;
    
    -- Migrer les résultats d'éligibilité
    FOR eligibility_record IN 
        SELECT * FROM "SimulatorEligibility" 
        WHERE session_id = session_record.id
    LOOP
        -- Vérifier si le produit existe déjà
        IF NOT EXISTS (
            SELECT 1 FROM "ClientProduitEligible" 
            WHERE "clientId" = client_record.id 
            AND "produitId" = eligibility_record.produit_id
        ) THEN
            INSERT INTO "ClientProduitEligible" (
                "clientId",
                "produitId",
                statut,
                "tauxFinal",
                "montantFinal",
                "dureeFinale",
                metadata,
                notes,
                priorite,
                created_at,
                updated_at
            ) VALUES (
                client_record.id,
                eligibility_record.produit_id,
                CASE 
                    WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                    WHEN eligibility_record.eligibility_score >= 40 THEN 'en_cours'
                    ELSE 'non_eligible'
                END,
                eligibility_record.eligibility_score,
                COALESCE(eligibility_record.estimated_savings, 0),
                12,
                jsonb_build_object(
                    'migrated_from_simulator', true,
                    'original_session_token', p_session_token,
                    'confidence_level', eligibility_record.confidence_level,
                    'calculation_details', eligibility_record.calculation_details,
                    'migration_date', NOW()
                ),
                'Migration manuelle depuis simulateur',
                CASE 
                    WHEN eligibility_record.eligibility_score >= 70 THEN 1
                    WHEN eligibility_record.eligibility_score >= 40 THEN 2
                    ELSE 3
                END,
                NOW(),
                NOW()
            );
            
            migrated_count := migrated_count + 1;
        END IF;
    END LOOP;
    
    -- Marquer la session comme migrée
    UPDATE "SimulatorSession" 
    SET 
        status = 'migrated',
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'migrated_to_client', client_record.id,
            'migrated_at', NOW(),
            'migrated_eligibility_count', migrated_count
        )
    WHERE session_token = p_session_token;
    
    -- Retourner le résultat
    migration_result := jsonb_build_object(
        'success', true,
        'session_token', p_session_token,
        'client_id', client_record.id,
        'client_email', client_record.email,
        'migrated_products_count', migrated_count,
        'message', 'Migration manuelle réussie'
    );
    
    RETURN migration_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. MIGRER LES SESSIONS RÉCENTES POUR wamuchacha@gmail.com
DO $$
DECLARE
    session_record RECORD;
    migration_result json;
BEGIN
    -- Trouver les sessions récentes non migrées
    FOR session_record IN 
        SELECT session_token 
        FROM "SimulatorSession" 
        WHERE status IN ('completed', 'active')
        AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE 'Migration de la session: %', session_record.session_token;
        
        SELECT migrate_session_manually_corrected(session_record.session_token, 'wamuchacha@gmail.com') INTO migration_result;
        
        RAISE NOTICE 'Résultat migration: %', migration_result;
    END LOOP;
END $$;

-- 5. VÉRIFICATION FINALE
SELECT 
    'VERIFICATION_MIGRATION' as section,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'migrated' THEN 1 END) as sessions_migrees,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as sessions_completees,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as sessions_actives
FROM "SimulatorSession";

-- 6. AFFICHER LES PRODUITS ÉLIGIBLES APRÈS MIGRATION
SELECT 
    'PRODUITS_APRES_MIGRATION' as section,
    cpe.id,
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.metadata,
    cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'wamuchacha@gmail.com'
ORDER BY cpe.created_at DESC; 