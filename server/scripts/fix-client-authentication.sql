-- =====================================================
-- CORRECTION AUTHENTIFICATION CLIENT MIGRÉ
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier le client existant
SELECT 
    id,
    email,
    name,
    company_name,
    siren,
    type,
    statut,
    "dateCreation"
FROM "Client" 
WHERE email = 'transport.dupont.2025.unique@test.fr'
ORDER BY "dateCreation" DESC;

-- 2. Créer un compte d'authentification Supabase pour le client
-- Note: Cette opération doit être faite via l'API Supabase Auth
-- car nous ne pouvons pas insérer directement dans auth.users

-- 3. Mettre à jour le client avec l'auth_id une fois le compte créé
-- UPDATE "Client" 
-- SET auth_id = 'UUID_DU_COMPTE_AUTH_CREE'
-- WHERE email = 'transport.dupont.2025.unique@test.fr';

-- 4. Vérifier les produits éligibles
SELECT 
    cpe.id,
    cpe."clientId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe."clientId" IN (
    SELECT id FROM "Client" 
    WHERE email = 'transport.dupont.2025.unique@test.fr'
);

-- 5. Créer une fonction pour automatiser la création de compte
CREATE OR REPLACE FUNCTION create_auth_account_for_migrated_client(
    p_client_email text,
    p_temp_password text DEFAULT 'TempPassword2025!'
)
RETURNS json AS $$
DECLARE
    client_record RECORD;
    auth_user_id uuid;
    result json;
BEGIN
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
    
    -- Créer le compte d'authentification via l'API Supabase
    -- Note: Cette partie nécessite un appel à l'API Supabase Auth
    -- qui ne peut pas être fait directement en SQL
    
    -- Pour l'instant, retourner les informations nécessaires
    result := jsonb_build_object(
        'success', true,
        'client_id', client_record.id,
        'email', client_record.email,
        'temp_password', p_temp_password,
        'message', 'Compte client trouvé. Créer le compte auth via l''API Supabase Auth',
        'next_steps', ARRAY[
            '1. Appeler l''API Supabase Auth pour créer le compte',
            '2. Mettre à jour le client avec auth_id',
            '3. Tester la connexion avec le mot de passe temporaire'
        ]
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 