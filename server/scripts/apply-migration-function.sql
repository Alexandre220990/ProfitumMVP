-- =====================================================
-- APPLICATION DE LA FONCTION DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- Fonction pour migrer une session vers un client existant
CREATE OR REPLACE FUNCTION migrate_simulator_to_existing_client(
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
    WHERE session_token = p_session_token AND status = 'completed';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou non complétée'
        );
    END IF;
    
    -- Récupérer le client existant
    SELECT * INTO client_record 
    FROM "Client" 
    WHERE email = p_client_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Client non trouvé avec cet email'
        );
    END IF;
    
    -- Migrer les résultats d'éligibilité
    FOR eligibility_record IN 
        SELECT * FROM "SimulatorEligibility" 
        WHERE session_id = session_record.id
    LOOP
        -- Vérifier si le produit est déjà associé
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
                metadata
            ) VALUES (
                client_record.id,
                eligibility_record.produit_id,
                CASE 
                    WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                    WHEN eligibility_record.eligibility_score >= 40 THEN 'potentiellement_eligible'
                    ELSE 'non_eligible'
                END,
                eligibility_record.eligibility_score,
                eligibility_record.estimated_savings,
                12, -- durée par défaut
                jsonb_build_object(
                    'migrated_from_simulator', true,
                    'original_session_token', p_session_token,
                    'confidence_level', eligibility_record.confidence_level,
                    'recommendations', eligibility_record.recommendations,
                    'calculation_details', eligibility_record.calculation_details
                )
            );
            
            migrated_count := migrated_count + 1;
        ELSE
            -- Mettre à jour le produit existant
            UPDATE "ClientProduitEligible" 
            SET 
                statut = CASE 
                    WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                    WHEN eligibility_record.eligibility_score >= 40 THEN 'potentiellement_eligible'
                    ELSE 'non_eligible'
                END,
                "tauxFinal" = eligibility_record.eligibility_score,
                "montantFinal" = eligibility_record.estimated_savings,
                metadata = jsonb_build_object(
                    'migrated_from_simulator', true,
                    'original_session_token', p_session_token,
                    'confidence_level', eligibility_record.confidence_level,
                    'recommendations', eligibility_record.recommendations,
                    'calculation_details', eligibility_record.calculation_details,
                    'updated_at', NOW()
                )
            WHERE "clientId" = client_record.id 
            AND "produitId" = eligibility_record.produit_id;
            
            migrated_count := migrated_count + 1;
        END IF;
    END LOOP;
    
    -- Marquer la session comme migrée
    UPDATE "SimulatorSession" 
    SET 
        status = 'migrated',
        updated_at = NOW(),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{migrated_to_client}',
            client_record.id::text::jsonb
        )
    WHERE session_token = p_session_token;
    
    -- Retourner le résultat
    migration_result := jsonb_build_object(
        'success', true,
        'client_id', client_record.id,
        'client_email', client_record.email,
        'migrated_products_count', migrated_count,
        'session_token', p_session_token,
        'message', 'Migration réussie vers le client existant'
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

-- Vérifier que la fonction a été créée
SELECT 
    'Fonction de migration' as section,
    routine_name,
    routine_type,
    'CRÉÉE' as status
FROM information_schema.routines 
WHERE routine_name = 'migrate_simulator_to_existing_client';

-- Test de la fonction avec une session existante
-- (à décommenter pour tester)
-- SELECT migrate_simulator_to_existing_client('SESSION_TOKEN_TEST', 'test2@test.fr');

-- Commentaire sur la fonction
COMMENT ON FUNCTION migrate_simulator_to_existing_client(text, text) IS 'Migre une session simulateur vers un client existant identifié par email'; 