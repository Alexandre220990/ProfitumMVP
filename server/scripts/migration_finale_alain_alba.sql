-- =====================================================
-- MIGRATION FINALE: Alain Bonin & Alba BONIN
-- Date : 2025-11-05
-- Objectif : Lier les simulations temporaires aux clients réels
-- =====================================================

-- DONNÉES CLIENTS:
-- Alba: be2cf2fb-c102-494d-b7ba-fb4196d49f02 (créée 12:31:32)
-- Alain: 4c367715-56e3-4992-b9aa-80e4fd48ca6c (créé 12:52:09)

-- ===== ÉTAPE 1: DIAGNOSTIC INITIAL =====
DO $$
DECLARE
    alba_id UUID := 'be2cf2fb-c102-494d-b7ba-fb4196d49f02';
    alain_id UUID := '4c367715-56e3-4992-b9aa-80e4fd48ca6c';
    alba_sim_count INTEGER;
    alain_sim_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DIAGNOSTIC INITIAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Alba
    SELECT COUNT(*) INTO alba_sim_count FROM simulations WHERE client_id = alba_id;
    RAISE NOTICE '👤 Alba BONIN (%):', alba_id;
    RAISE NOTICE '   Email: albabonin@gmail.com';
    RAISE NOTICE '   Simulations actuelles: %', alba_sim_count;
    
    -- Alain
    SELECT COUNT(*) INTO alain_sim_count FROM simulations WHERE client_id = alain_id;
    RAISE NOTICE '';
    RAISE NOTICE '👤 Alain Bonin (%):', alain_id;
    RAISE NOTICE '   Email: alain@profitum.fr';
    RAISE NOTICE '   Simulations actuelles: %', alain_sim_count;
    RAISE NOTICE '';
END $$;

-- ===== ÉTAPE 2: IDENTIFIER LES SIMULATIONS TEMPORAIRES CANDIDATES =====
SELECT '🔍 SIMULATIONS TEMPORAIRES CANDIDATES' as section;

-- Simulations créées AVANT Alba (12:31:32)
SELECT 
    'ALBA - Avant 12:31:32' as pour_qui,
    s.id as simulation_id,
    s.session_token,
    s.client_id,
    c.email as client_email_actuel,
    c.type as client_type,
    s.type as sim_type,
    s.status,
    s.created_at,
    TO_CHAR(s.created_at, 'HH24:MI:SS') as heure,
    EXTRACT(EPOCH FROM (TIMESTAMP '2025-11-05 12:31:32+00' - s.created_at)) / 60 as minutes_avant,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' THEN (
            SELECT COUNT(*) FROM jsonb_object_keys(s.answers)
        )
        ELSE 0
    END as nb_reponses,
    s.metadata->'client_data'->>'company_name' as company_from_metadata
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at BETWEEN 
    TIMESTAMP '2025-11-05 12:00:00+00' AND 
    TIMESTAMP '2025-11-05 12:31:32+00'
ORDER BY s.created_at DESC

UNION ALL

-- Simulations créées ENTRE Alba et Alain (12:31:32 - 12:52:09)
SELECT 
    'ALAIN - Entre 12:31 et 12:52' as pour_qui,
    s.id as simulation_id,
    s.session_token,
    s.client_id,
    c.email as client_email_actuel,
    c.type as client_type,
    s.type as sim_type,
    s.status,
    s.created_at,
    TO_CHAR(s.created_at, 'HH24:MI:SS') as heure,
    EXTRACT(EPOCH FROM (TIMESTAMP '2025-11-05 12:52:09+00' - s.created_at)) / 60 as minutes_avant,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' THEN (
            SELECT COUNT(*) FROM jsonb_object_keys(s.answers)
        )
        ELSE 0
    END as nb_reponses,
    s.metadata->'client_data'->>'company_name' as company_from_metadata
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at BETWEEN 
    TIMESTAMP '2025-11-05 12:31:32+00' AND 
    TIMESTAMP '2025-11-05 12:52:09+00'
ORDER BY s.created_at DESC;

-- ===== ÉTAPE 3: VOIR LES CLIENTS TEMPORAIRES =====
SELECT '👻 CLIENTS TEMPORAIRES D''AUJOURD''HUI' as section;

SELECT 
    c.id,
    c.email,
    c.type,
    c.company_name,
    c.created_at,
    TO_CHAR(c.created_at, 'HH24:MI:SS') as heure,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations
FROM "Client" c
WHERE c.created_at >= DATE_TRUNC('day', NOW())
AND c.created_at < DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
AND c.type = 'temporaire'
ORDER BY c.created_at DESC;

-- ===== ÉTAPE 4: PRODUITS ÉLIGIBLES ACTUELS =====
SELECT '📦 PRODUITS ÉLIGIBLES ACTUELS' as section;

SELECT 
    c.email,
    COUNT(cpe.id) as nb_produits,
    SUM(COALESCE(cpe."montantFinal", 0)) as montant_total
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
GROUP BY c.email;

-- ===== ÉTAPE 5: DÉTAILS DES PRODUITS =====
SELECT 
    c.email,
    c.name,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe."dateEligibilite",
    cpe."simulationId"
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, cpe."dateEligibilite" DESC;

-- ===== ÉTAPE 6: RECHERCHE INTELLIGENTE PAR SESSION TOKEN =====
-- Chercher dans user_sessions ou tracking

SELECT '🔐 RECHERCHE PAR SESSION TOKEN' as section;

SELECT 
    us.session_token,
    us.client_id,
    us.user_id,
    us.is_anonymous,
    us.created_at,
    us.last_activity,
    us.metadata->>'email' as email_metadata,
    c.email as client_email
FROM user_sessions us
LEFT JOIN "Client" c ON c.id = us.client_id
WHERE us.created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '1 day'
AND (
    us.metadata->>'email' IN ('albabonin@gmail.com', 'alain@profitum.fr')
    OR us.user_id IN (
        'c51f11f6-b137-412d-afea-2a3f8011fc21',
        'ae71946f-2724-49b2-8ea7-1f211056419d'
    )
    OR us.client_id IN (
        'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
        '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
    )
)
ORDER BY us.created_at DESC;

-- ===== ÉTAPE 7: PLAN DE MIGRATION =====
DO $$
DECLARE
    alba_id UUID := 'be2cf2fb-c102-494d-b7ba-fb4196d49f02';
    alain_id UUID := '4c367715-56e3-4992-b9aa-80e4fd48ca6c';
    alba_temp_client_id UUID;
    alain_temp_client_id UUID;
    alba_sim_id UUID;
    alain_sim_id UUID;
    sim_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 PLAN DE MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Chercher la simulation la plus proche pour Alba (avant 12:31:32)
    SELECT s.id, s.client_id INTO alba_sim_id, alba_temp_client_id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:31:32+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:00:00+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF alba_sim_id IS NOT NULL THEN
        RAISE NOTICE '✅ Simulation trouvée pour Alba:';
        RAISE NOTICE '   Simulation ID: %', alba_sim_id;
        RAISE NOTICE '   Client temporaire: %', alba_temp_client_id;
        RAISE NOTICE '   👉 ACTION: Lier cette simulation à Alba (%)' , alba_id;
    ELSE
        RAISE NOTICE '❌ Aucune simulation temporaire trouvée pour Alba';
        RAISE NOTICE '   👉 ACTION: Vérifier manuellement ou créer une nouvelle simulation';
    END IF;
    
    RAISE NOTICE '';
    
    -- Chercher la simulation la plus proche pour Alain (avant 12:52:09)
    SELECT s.id, s.client_id INTO alain_sim_id, alain_temp_client_id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:52:09+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:31:32+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF alain_sim_id IS NOT NULL THEN
        RAISE NOTICE '✅ Simulation trouvée pour Alain:';
        RAISE NOTICE '   Simulation ID: %', alain_sim_id;
        RAISE NOTICE '   Client temporaire: %', alain_temp_client_id;
        RAISE NOTICE '   👉 ACTION: Lier cette simulation à Alain (%)' , alain_id;
    ELSE
        RAISE NOTICE '❌ Aucune simulation temporaire trouvée pour Alain';
        RAISE NOTICE '   👉 ACTION: Vérifier manuellement ou créer une nouvelle simulation';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ===== ÉTAPE 8: MIGRATION AUTOMATIQUE (COMMENTÉE - À DÉCOMMENTER APRÈS VALIDATION) =====
/*
DO $$
DECLARE
    alba_id UUID := 'be2cf2fb-c102-494d-b7ba-fb4196d49f02';
    alain_id UUID := '4c367715-56e3-4992-b9aa-80e4fd48ca6c';
    alba_sim_id UUID;
    alain_sim_id UUID;
    migrations_effectuees INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 MIGRATION AUTOMATIQUE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- MIGRATION ALBA
    SELECT s.id INTO alba_sim_id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:31:32+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:00:00+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF alba_sim_id IS NOT NULL THEN
        -- Mettre à jour la simulation
        UPDATE simulations
        SET 
            client_id = alba_id,
            type = 'authentifiee',
            updated_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'migrated_at', NOW(),
                'migrated_from', 'temporary_client',
                'migration_reason', 'client_registration'
            )
        WHERE id = alba_sim_id;
        
        -- Mettre à jour les produits éligibles
        UPDATE "ClientProduitEligible"
        SET 
            "clientId" = alba_id,
            "simulationId" = alba_sim_id
        WHERE "simulationId" = alba_sim_id
        OR "clientId" IN (
            SELECT client_id FROM simulations WHERE id = alba_sim_id
        );
        
        migrations_effectuees := migrations_effectuees + 1;
        RAISE NOTICE '✅ Alba: Simulation % migrée', alba_sim_id;
    END IF;
    
    -- MIGRATION ALAIN
    SELECT s.id INTO alain_sim_id
    FROM simulations s
    LEFT JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at < TIMESTAMP '2025-11-05 12:52:09+00'
    AND s.created_at > TIMESTAMP '2025-11-05 12:31:32+00'
    AND (c.type = 'temporaire' OR c.email LIKE '%@profitum.temp')
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF alain_sim_id IS NOT NULL THEN
        -- Mettre à jour la simulation
        UPDATE simulations
        SET 
            client_id = alain_id,
            type = 'authentifiee',
            updated_at = NOW(),
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'migrated_at', NOW(),
                'migrated_from', 'temporary_client',
                'migration_reason', 'client_registration'
            )
        WHERE id = alain_sim_id;
        
        -- Mettre à jour les produits éligibles
        UPDATE "ClientProduitEligible"
        SET 
            "clientId" = alain_id,
            "simulationId" = alain_sim_id
        WHERE "simulationId" = alain_sim_id
        OR "clientId" IN (
            SELECT client_id FROM simulations WHERE id = alain_sim_id
        );
        
        migrations_effectuees := migrations_effectuees + 1;
        RAISE NOTICE '✅ Alain: Simulation % migrée', alain_sim_id;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ % MIGRATION(S) EFFECTUÉE(S)', migrations_effectuees;
    RAISE NOTICE '========================================';
END $$;
*/

-- ===== INSTRUCTIONS POUR L'UTILISATEUR =====
SELECT '📖 INSTRUCTIONS' as section;

SELECT 'ÉTAPE 1: Exécuter ce script pour voir le diagnostic' as instruction
UNION ALL SELECT 'ÉTAPE 2: Vérifier que les simulations identifiées correspondent bien aux utilisateurs'
UNION ALL SELECT 'ÉTAPE 3: Décommenter la section ÉTAPE 8 (MIGRATION AUTOMATIQUE)'
UNION ALL SELECT 'ÉTAPE 4: Ré-exécuter le script pour effectuer la migration'
UNION ALL SELECT 'ÉTAPE 5: Vérifier les résultats avec les requêtes de contrôle ci-dessous';

-- ===== REQUÊTES DE CONTRÔLE POST-MIGRATION =====
SELECT '✅ CONTRÔLE POST-MIGRATION' as section;

-- Vérifier les simulations
SELECT 
    'Simulations' as type,
    c.email,
    COUNT(s.id) as count
FROM "Client" c
LEFT JOIN simulations s ON s.client_id = c.id
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
GROUP BY c.email

UNION ALL

-- Vérifier les produits
SELECT 
    'Produits éligibles' as type,
    c.email,
    COUNT(cpe.id) as count
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
GROUP BY c.email;

