-- =====================================================
-- FONCTIONS POUR AUTOMATISATION DU PROCESSUS TEMPORAIRE
-- =====================================================

-- FONCTION POUR CRÉER UN CLIENT TEMPORAIRE AUTOMATIQUEMENT
CREATE OR REPLACE FUNCTION create_temporary_client(
    p_session_token TEXT,
    p_client_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
    v_temp_email TEXT;
    v_temp_password TEXT;
BEGIN
    -- Générer un email temporaire unique
    v_temp_email := 'temp_' || extract(epoch from now())::text || '_' || 
                   encode(gen_random_bytes(4), 'hex') || '@profitum.temp';
    
    -- Générer un mot de passe temporaire sécurisé
    v_temp_password := encode(gen_random_bytes(32), 'hex');
    
    -- Créer le client temporaire
    INSERT INTO "Client" (
        id,
        email,
        password,
        name,
        company_name,
        phone_number,
        type,
        statut,
        "expires_at",
        "temp_password",
        "dateCreation",
        "derniereConnexion",
        created_at,
        updated_at,
        metadata
    ) VALUES (
        gen_random_uuid(),
        v_temp_email,
        crypt(v_temp_password, gen_salt('bf')),
        COALESCE(p_client_data->>'name', 'Client Temporaire'),
        COALESCE(p_client_data->>'company_name', 'Entreprise Temporaire'),
        COALESCE(p_client_data->>'phone_number', NULL),
        'temporaire',
        'actif',
        NOW() + INTERVAL '24 hours',
        v_temp_password,
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'session_token', p_session_token,
            'source', 'simulator_temporary',
            'client_data', p_client_data
        )
    ) RETURNING id INTO v_client_id;
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION POUR MIGRER UN CLIENT TEMPORAIRE VERS PERMANENT
CREATE OR REPLACE FUNCTION migrate_temporary_client(
    p_temp_client_id UUID,
    p_real_email TEXT,
    p_real_password TEXT,
    p_real_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Mettre à jour le client temporaire avec les vraies données
    UPDATE "Client" 
    SET 
        email = p_real_email,
        password = crypt(p_real_password, gen_salt('bf')),
        name = COALESCE(p_real_data->>'name', name),
        company_name = COALESCE(p_real_data->>'company_name', company_name),
        phone_number = COALESCE(p_real_data->>'phone_number', phone_number),
        type = 'actif',
        statut = 'actif',
        "expires_at" = NULL,
        "temp_password" = NULL,
        updated_at = NOW(),
        metadata = metadata || jsonb_build_object(
            'migrated_at', NOW(),
            'migration_source', 'temporary_to_permanent',
            'real_data', p_real_data
        )
    WHERE id = p_temp_client_id AND type = 'temporaire';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION POUR CRÉER UNE SIMULATION AVEC CLIENT TEMPORAIRE
CREATE OR REPLACE FUNCTION create_simulation_with_temporary_client(
    p_session_token TEXT,
    p_client_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_client_id UUID;
    v_simulation_id UUID;
    v_result JSON;
BEGIN
    -- Créer le client temporaire
    v_client_id := create_temporary_client(p_session_token, p_client_data);
    
    -- Créer la simulation liée au client temporaire
    INSERT INTO "simulations" (
        client_id,
        session_token,
        status,
        type,
        metadata,
        expires_at
    ) VALUES (
        v_client_id,
        p_session_token,
        'en_cours',
        'temporaire',
        jsonb_build_object(
            'client_data', p_client_data,
            'created_via', 'temporary_client_creation'
        ),
        NOW() + INTERVAL '24 hours'
    ) RETURNING id INTO v_simulation_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'client_id', v_client_id,
        'simulation_id', v_simulation_id,
        'session_token', p_session_token,
        'expires_at', NOW() + INTERVAL '24 hours'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;