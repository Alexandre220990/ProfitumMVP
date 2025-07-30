-- =====================================================
-- CORRECTION FINALE FONCTION DE MIGRATION
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
    hashed_password text;
    produit_uuid uuid;
    taux_final_normalise numeric;
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
    
    -- Générer un mot de passe temporaire crypté
    -- Utiliser un hash bcrypt standard (salt rounds = 10)
    hashed_password := crypt('TempPassword2025!', gen_salt('bf', 10));
    
    -- Créer le client avec les données d'inscription (noms de colonnes corrects selon la doc)
    INSERT INTO "Client" (
        email,
        password,
        name,
        company_name,
        phone_number,
        address,
        city,
        postal_code,
        siren,
        type,
        statut,
        "derniereConnexion",
        "dateCreation",
        updated_at,
        created_at,
        metadata
    ) VALUES (
        p_client_inscription_data->>'email',
        hashed_password,
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
        NOW(),
        jsonb_build_object(
            'source', 'simulator_migration',
            'session_token', p_session_token,
            'migration_date', NOW(),
            'temp_password', true,
            'password_reset_required', true
        )
    ) RETURNING id INTO client_id;
    
    -- Migrer les résultats d'éligibilité
    FOR eligibility_record IN 
        SELECT * FROM "SimulatorEligibility" 
        WHERE session_id = session_record.id
    LOOP
        -- Récupérer l'UUID du produit basé sur le nom
        SELECT id INTO produit_uuid
        FROM "ProduitEligible"
        WHERE LOWER(nom) = LOWER(eligibility_record.produit_id)
        LIMIT 1;
        
        -- Si le produit n'existe pas, créer un mapping par défaut
        IF produit_uuid IS NULL THEN
            -- Mapping par défaut pour les produits de test
            CASE eligibility_record.produit_id
                WHEN 'TICPE' THEN
                    SELECT id INTO produit_uuid FROM "ProduitEligible" WHERE LOWER(nom) LIKE '%ticpe%' LIMIT 1;
                WHEN 'URSSAF' THEN
                    SELECT id INTO produit_uuid FROM "ProduitEligible" WHERE LOWER(nom) LIKE '%urssaf%' LIMIT 1;
                WHEN 'DFS' THEN
                    SELECT id INTO produit_uuid FROM "ProduitEligible" WHERE LOWER(nom) LIKE '%dfs%' LIMIT 1;
                ELSE
                    -- Prendre le premier produit disponible
                    SELECT id INTO produit_uuid FROM "ProduitEligible" LIMIT 1;
            END CASE;
        END IF;
        
        -- Normaliser le taux final (score d'éligibilité entre 0 et 100 -> taux entre 0 et 1)
        taux_final_normalise := LEAST(GREATEST(eligibility_record.eligibility_score::numeric / 100.0, 0.0), 1.0);
        
        -- Insérer seulement si on a trouvé un produit
        IF produit_uuid IS NOT NULL THEN
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
                produit_uuid,
                CASE 
                    WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                    WHEN eligibility_record.eligibility_score >= 40 THEN 'en_cours'
                    ELSE 'non_eligible'
                END,
                taux_final_normalise,
                COALESCE(eligibility_record.estimated_savings, 0),
                12, -- durée par défaut
                jsonb_build_object(
                    'migrated_from_simulator', true,
                    'original_session_token', p_session_token,
                    'original_eligibility_score', eligibility_record.eligibility_score,
                    'confidence_level', eligibility_record.confidence_level,
                    'recommendations', eligibility_record.recommendations,
                    'calculation_details', eligibility_record.calculation_details
                )
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
        'message', 'Migration réussie - Mot de passe temporaire généré',
        'temp_password_info', 'Le client devra changer son mot de passe lors de la première connexion'
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