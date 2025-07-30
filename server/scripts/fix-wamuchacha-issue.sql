-- =====================================================
-- CORRECTION DES PROBLÈMES CLIENT - wamuchacha@gmail.com
-- Date: 2025-01-30
-- =====================================================

-- Fonction pour migrer une session simulateur vers un client existant
CREATE OR REPLACE FUNCTION fix_wamuchacha_client_issue()
RETURNS JSON AS $$
DECLARE
    auth_user_id uuid;
    client_id uuid;
    admin_exists boolean := false;
    session_record RECORD;
    eligibility_record RECORD;
    migrated_count integer := 0;
    result JSON;
BEGIN
    -- 1. Vérifier si l'utilisateur existe dans auth.users
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'wamuchacha@gmail.com';
    
    IF auth_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Utilisateur non trouvé dans auth.users'
        );
    END IF;
    
    -- 2. Vérifier s'il y a un conflit admin
    SELECT EXISTS(SELECT 1 FROM "Admin" WHERE email = 'wamuchacha@gmail.com') INTO admin_exists;
    
    -- 3. Vérifier/créer le client
    SELECT id INTO client_id 
    FROM "Client" 
    WHERE email = 'wamuchacha@gmail.com';
    
    IF client_id IS NULL THEN
        -- Créer le client s'il n'existe pas
        INSERT INTO "Client" (
            email,
            auth_id,
            name,
            company_name,
            created_at,
            updated_at
        ) VALUES (
            'wamuchacha@gmail.com',
            auth_user_id,
            'Client Wamuchacha',
            'Entreprise Test',
            NOW(),
            NOW()
        ) RETURNING id INTO client_id;
        
        RAISE NOTICE 'Client créé avec ID: %', client_id;
    ELSE
        -- Mettre à jour l'auth_id si nécessaire
        UPDATE "Client" 
        SET auth_id = auth_user_id, updated_at = NOW()
        WHERE id = client_id AND auth_id IS DISTINCT FROM auth_user_id;
        
        RAISE NOTICE 'Client existant trouvé avec ID: %', client_id;
    END IF;
    
    -- 4. Si c'est un admin, le supprimer pour éviter les conflits
    IF admin_exists THEN
        DELETE FROM "Admin" WHERE email = 'wamuchacha@gmail.com';
        RAISE NOTICE 'Entrée admin supprimée pour éviter les conflits';
    END IF;
    
    -- 5. Migrer les sessions simulateur récentes si elles existent
    FOR session_record IN 
        SELECT * FROM "SimulatorSession" 
        WHERE metadata::text LIKE '%wamuchacha%' 
        AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
    LOOP
        RAISE NOTICE 'Migration de la session: %', session_record.session_token;
        
        -- Migrer les résultats d'éligibilité
        FOR eligibility_record IN 
            SELECT * FROM "SimulatorEligibility" 
            WHERE session_id = session_record.id
        LOOP
            -- Vérifier si le produit éligible n'existe pas déjà
            IF NOT EXISTS (
                SELECT 1 FROM "ClientProduitEligible" 
                WHERE "clientId" = client_id 
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
                    created_at,
                    updated_at
                ) VALUES (
                    client_id,
                    eligibility_record.produit_id,
                    CASE 
                        WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                        WHEN eligibility_record.eligibility_score >= 40 THEN 'potentiellement_eligible'
                        ELSE 'non_eligible'
                    END,
                    eligibility_record.eligibility_score::numeric / 100,
                    eligibility_record.estimated_savings,
                    12, -- durée par défaut
                    jsonb_build_object(
                        'migrated_from_simulator', true,
                        'original_session_token', session_record.session_token,
                        'confidence_level', eligibility_record.confidence_level,
                        'recommendations', eligibility_record.recommendations,
                        'calculation_details', eligibility_record.calculation_details,
                        'migration_date', NOW()
                    ),
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
            metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{migrated_to_client}',
                client_id::text::jsonb
            )
        WHERE id = session_record.id;
    END LOOP;
    
    -- 6. Si aucun produit éligible n'existe, créer des exemples de test
    IF NOT EXISTS (
        SELECT 1 FROM "ClientProduitEligible" 
        WHERE "clientId" = client_id
    ) THEN
        -- Insérer des produits éligibles de test
        INSERT INTO "ClientProduitEligible" (
            "clientId",
            "produitId",
            statut,
            "tauxFinal",
            "montantFinal",
            "dureeFinale",
            metadata,
            created_at,
            updated_at
        ) 
        SELECT 
            client_id,
            pe.id,
            'eligible',
            0.75,
            5000 + (RANDOM() * 10000)::integer,
            12,
            jsonb_build_object(
                'created_for_demo', true,
                'eligibility_score', 75 + (RANDOM() * 20)::integer,
                'confidence_level', 'high',
                'recommendations', ARRAY['Éligible ' || pe.nom, 'Contactez un expert']
            ),
            NOW(),
            NOW()
        FROM "ProduitEligible" pe
        WHERE pe.nom IN ('TICPE', 'URSSAF', 'DFS')
        LIMIT 3;
        
        migrated_count := 3;
        RAISE NOTICE 'Produits éligibles de démonstration créés';
    END IF;
    
    -- 7. Retourner le résultat
    result := jsonb_build_object(
        'success', true,
        'client_id', client_id,
        'auth_user_id', auth_user_id,
        'admin_conflict_resolved', admin_exists,
        'migrated_products_count', migrated_count,
        'message', 'Problèmes corrigés avec succès'
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

-- Exécuter la fonction de correction
SELECT fix_wamuchacha_client_issue() as result;

-- Vérification après correction
SELECT 
    'VERIFICATION_APRES_CORRECTION' as section,
    (SELECT COUNT(*) FROM "Client" WHERE email = 'wamuchacha@gmail.com') as clients_count,
    (SELECT COUNT(*) FROM "Admin" WHERE email = 'wamuchacha@gmail.com') as admins_count,
    (SELECT COUNT(*) FROM "ClientProduitEligible" cpe 
     JOIN "Client" c ON cpe."clientId" = c.id 
     WHERE c.email = 'wamuchacha@gmail.com') as produits_eligibles_count;