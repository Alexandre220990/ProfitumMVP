-- =====================================================
-- CORRECTION FONCTION DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS migrate_simulator_to_client(text, jsonb);

-- Créer la fonction corrigée avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION migrate_simulator_to_client(
    p_session_token text,
    p_client_inscription_data jsonb
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    eligibility_record RECORD;
    client_id uuid;
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
    
    -- Créer le client avec les données d'inscription (noms de colonnes corrects)
    INSERT INTO "Client" (
        email,
        name,
        company_name,
        phone_number,
        address,
        city,
        postal_code,
        siren,
        type,
        statut,
        dateCreation,
        updated_at,
        created_at,
        metadata
    ) VALUES (
        p_client_inscription_data->>'email',
        p_client_inscription_data->>'name',
        p_client_inscription_data->>'company_name',
        p_client_inscription_data->>'phone_number',
        p_client_inscription_data->>'address',
        p_client_inscription_data->>'city',
        p_client_inscription_data->>'postal_code',
        p_client_inscription_data->>'siren',
        'client',
        'actif',
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'source', 'simulator_migration',
            'session_token', p_session_token,
            'migration_date', NOW()
        )
    ) RETURNING id INTO client_id;
    
    -- Migrer les résultats d'éligibilité
    FOR eligibility_record IN 
        SELECT * FROM "SimulatorEligibility" 
        WHERE session_id = session_record.id
    LOOP
        INSERT INTO "ClientProduitEligible" (
            "clientId",
            "produitId",
            statut,
            "tauxFinal",
            "montantFinal",
            "dureeFinale",
            metadata
        ) VALUES (
            client_id,
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
    END LOOP;
    
    -- Marquer la session comme migrée
    UPDATE "SimulatorSession" 
    SET 
        status = 'migrated',
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'migrated_to_client', client_id,
            'migrated_at', NOW(),
            'migrated_eligibility_count', migrated_count
        )
    WHERE id = session_record.id;
    
    migration_result := jsonb_build_object(
        'success', true,
        'session_token', p_session_token,
        'client_id', client_id,
        'migrated_eligibility_count', migrated_count,
        'message', 'Migration réussie'
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