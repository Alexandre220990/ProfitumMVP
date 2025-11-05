-- =====================================================
-- MIGRATION SPÉCIFIQUE: Alain Bonin & Alba BONIN
-- Date : 2025-11-05
-- Objectif : Lier correctement les simulations préalables à l'inscription
-- =====================================================

-- Auth IDs:
-- alain@profitum.fr: ae71946f-2724-49b2-8ea7-1f211056419d (créé 12:52:09)
-- albabonin@gmail.com: c51f11f6-b137-412d-afea-2a3f8011fc21 (créé 12:31:32)

-- ===== 1. IDENTIFIER LES CLIENTS DANS LA TABLE CLIENT =====
DO $$
DECLARE
    alain_client_id UUID;
    alba_client_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '👥 IDENTIFICATION DES CLIENTS';
    RAISE NOTICE '========================================';
    
    -- Alain
    SELECT id INTO alain_client_id 
    FROM "Client" 
    WHERE email = 'alain@profitum.fr' 
    OR auth_user_id = 'ae71946f-2724-49b2-8ea7-1f211056419d'::uuid;
    
    IF alain_client_id IS NOT NULL THEN
        RAISE NOTICE '✅ Alain trouvé - Client ID: %', alain_client_id;
    ELSE
        RAISE NOTICE '❌ Alain NON TROUVÉ dans la table Client';
    END IF;
    
    -- Alba
    SELECT id INTO alba_client_id 
    FROM "Client" 
    WHERE email = 'albabonin@gmail.com' 
    OR auth_user_id = 'c51f11f6-b137-412d-afea-2a3f8011fc21'::uuid;
    
    IF alba_client_id IS NOT NULL THEN
        RAISE NOTICE '✅ Alba trouvée - Client ID: %', alba_client_id;
    ELSE
        RAISE NOTICE '❌ Alba NON TROUVÉE dans la table Client';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ===== 2. DÉTAILS DES CLIENTS =====
SELECT '📋 DÉTAILS DES CLIENTS' as section;

SELECT 
    id,
    email,
    name,
    company_name,
    siren,
    type,
    statut,
    auth_user_id,
    created_at,
    updated_at
FROM "Client"
WHERE email IN ('alain@profitum.fr', 'albabonin@gmail.com')
ORDER BY created_at DESC;

-- ===== 3. SIMULATIONS ACTUELLES LIÉES À CES CLIENTS =====
SELECT '🔍 SIMULATIONS ACTUELLES' as section;

SELECT 
    s.id,
    s.client_id,
    c.email,
    c.name,
    s.session_token,
    s.type,
    s.status,
    s.created_at,
    s.updated_at,
    s.expires_at,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' THEN (
            SELECT COUNT(*) FROM jsonb_object_keys(s.answers)
        )
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'array' THEN jsonb_array_length(s.answers)
        ELSE 0
    END as nb_reponses,
    s.metadata
FROM simulations s
JOIN "Client" c ON c.id = s.client_id
WHERE c.email IN ('alain@profitum.fr', 'albabonin@gmail.com')
ORDER BY s.created_at DESC;

-- ===== 4. CHERCHER LES SIMULATIONS TEMPORAIRES POTENTIELLES =====
SELECT '🔎 SIMULATIONS TEMPORAIRES CRÉÉES AUJOURD''HUI' as section;

-- Toutes les simulations temporaires créées aujourd'hui
SELECT 
    s.id,
    s.client_id,
    c.email as client_email,
    c.type as client_type,
    s.session_token,
    s.type as sim_type,
    s.status,
    s.created_at,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' THEN (
            SELECT COUNT(*) FROM jsonb_object_keys(s.answers)
        )
        ELSE 0
    END as nb_reponses,
    s.metadata->>'client_email' as metadata_email,
    s.metadata->>'created_via' as created_via
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at >= DATE_TRUNC('day', NOW())
AND s.created_at < DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
ORDER BY s.created_at DESC;

-- ===== 5. PRODUITS ÉLIGIBLES ACTUELS =====
SELECT '📦 PRODUITS ÉLIGIBLES ACTUELS' as section;

SELECT 
    c.email,
    c.name,
    cpe.id as cpe_id,
    p.nom as produit_nom,
    cpe.statut,
    cpe."montantFinal",
    cpe."tauxFinal",
    cpe."simulationId",
    cpe."sessionId",
    cpe."dateEligibilite",
    cpe.metadata
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.email IN ('alain@profitum.fr', 'albabonin@gmail.com')
ORDER BY c.email, cpe."dateEligibilite" DESC;

-- ===== 6. ANALYSE DES DONNÉES DE SIMULATION DANS LES LOGS =====
-- Rechercher dans les metadata ou session_tokens qui pourraient correspondre

SELECT '🔍 RECHERCHE DE CORRESPONDANCES' as section;

-- Chercher les simulations avec des indices de ces utilisateurs
SELECT 
    s.id,
    s.session_token,
    s.client_id,
    c.email,
    s.type,
    s.status,
    s.created_at,
    s.metadata,
    CASE 
        WHEN s.metadata->>'client_email' = 'alain@profitum.fr' THEN 'ALAIN'
        WHEN s.metadata->>'client_email' = 'albabonin@gmail.com' THEN 'ALBA'
        WHEN s.metadata->'client_data'->>'email' = 'alain@profitum.fr' THEN 'ALAIN'
        WHEN s.metadata->'client_data'->>'email' = 'albabonin@gmail.com' THEN 'ALBA'
        ELSE NULL
    END as correspondance
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '1 day'
AND (
    s.metadata->>'client_email' IN ('alain@profitum.fr', 'albabonin@gmail.com')
    OR s.metadata->'client_data'->>'email' IN ('alain@profitum.fr', 'albabonin@gmail.com')
)
ORDER BY s.created_at DESC;

-- ===== 7. VÉRIFIER LES SESSIONS USER_SESSIONS =====
SELECT '🔐 SESSIONS UTILISATEURS' as section;

SELECT 
    session_token,
    user_id,
    client_id,
    is_anonymous,
    created_at,
    last_activity,
    metadata
FROM user_sessions
WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '1 day'
AND (
    metadata->>'email' IN ('alain@profitum.fr', 'albabonin@gmail.com')
    OR user_id IN (
        'ae71946f-2724-49b2-8ea7-1f211056419d',
        'c51f11f6-b137-412d-afea-2a3f8011fc21'
    )
)
ORDER BY created_at DESC;

-- ===== 8. DIAGNOSTIC ET RECOMMANDATIONS =====
DO $$
DECLARE
    alain_client_id UUID;
    alba_client_id UUID;
    alain_sim_count INTEGER;
    alba_sim_count INTEGER;
    alain_cpe_count INTEGER;
    alba_cpe_count INTEGER;
    temp_sim_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DIAGNOSTIC ET RECOMMANDATIONS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Récupérer les IDs
    SELECT id INTO alain_client_id FROM "Client" WHERE email = 'alain@profitum.fr';
    SELECT id INTO alba_client_id FROM "Client" WHERE email = 'albabonin@gmail.com';
    
    -- Alain
    IF alain_client_id IS NOT NULL THEN
        SELECT COUNT(*) INTO alain_sim_count FROM simulations WHERE client_id = alain_client_id;
        SELECT COUNT(*) INTO alain_cpe_count FROM "ClientProduitEligible" WHERE "clientId" = alain_client_id;
        
        RAISE NOTICE '👤 ALAIN BONIN (%):', alain_client_id;
        RAISE NOTICE '   - Simulations liées: %', alain_sim_count;
        RAISE NOTICE '   - Produits éligibles: %', alain_cpe_count;
        
        IF alain_sim_count = 0 THEN
            RAISE NOTICE '   ⚠️  PROBLÈME: Aucune simulation liée';
            RAISE NOTICE '   💡 ACTION: Rechercher et lier la simulation temporaire pré-inscription';
        ELSIF alain_cpe_count = 0 THEN
            RAISE NOTICE '   ⚠️  PROBLÈME: Aucun produit éligible';
            RAISE NOTICE '   💡 ACTION: Déclencher le calcul d''éligibilité';
        ELSE
            RAISE NOTICE '   ✅ État OK';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    
    -- Alba
    IF alba_client_id IS NOT NULL THEN
        SELECT COUNT(*) INTO alba_sim_count FROM simulations WHERE client_id = alba_client_id;
        SELECT COUNT(*) INTO alba_cpe_count FROM "ClientProduitEligible" WHERE "clientId" = alba_client_id;
        
        RAISE NOTICE '👤 ALBA BONIN (%):', alba_client_id;
        RAISE NOTICE '   - Simulations liées: %', alba_sim_count;
        RAISE NOTICE '   - Produits éligibles: %', alba_cpe_count;
        
        IF alba_sim_count = 0 THEN
            RAISE NOTICE '   ⚠️  PROBLÈME: Aucune simulation liée';
            RAISE NOTICE '   💡 ACTION: Rechercher et lier la simulation temporaire pré-inscription';
        ELSIF alba_cpe_count = 0 THEN
            RAISE NOTICE '   ⚠️  PROBLÈME: Aucun produit éligible';
            RAISE NOTICE '   💡 ACTION: Déclencher le calcul d''éligibilité';
        ELSE
            RAISE NOTICE '   ✅ État OK';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    
    -- Compter les simulations temporaires non liées
    SELECT COUNT(*) INTO temp_sim_count
    FROM simulations s
    JOIN "Client" c ON c.id = s.client_id
    WHERE s.created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '1 day'
    AND s.type = 'temporaire'
    AND c.type = 'temporaire'
    AND c.email LIKE '%@profitum.temp';
    
    RAISE NOTICE '🔄 Simulations temporaires non migrées: %', temp_sim_count;
    
    IF temp_sim_count > 0 THEN
        RAISE NOTICE '💡 Il existe des simulations temporaires qui pourraient correspondre';
        RAISE NOTICE '   Vérifier manuellement les timestamps et les données';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ===== 9. RECHERCHE AVANCÉE PAR TIMESTAMPS =====
-- Chercher les simulations créées JUSTE AVANT l'inscription

SELECT '⏰ SIMULATIONS CRÉÉES JUSTE AVANT L''INSCRIPTION' as section;

-- Pour Alain (créé à 12:52:09)
SELECT 
    'ALAIN - Simulations potentielles (créées entre 12:30 et 12:52)' as contexte,
    s.id,
    s.session_token,
    s.client_id,
    c.email as client_email,
    c.type as client_type,
    s.type as sim_type,
    s.status,
    s.created_at,
    EXTRACT(EPOCH FROM (TIMESTAMP '2025-11-05 12:52:09+00' - s.created_at)) / 60 as minutes_avant_inscription,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' THEN (
            SELECT COUNT(*) FROM jsonb_object_keys(s.answers)
        )
        ELSE 0
    END as nb_reponses
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at BETWEEN 
    TIMESTAMP '2025-11-05 12:30:00+00' AND 
    TIMESTAMP '2025-11-05 12:52:09+00'
ORDER BY s.created_at DESC

UNION ALL

-- Pour Alba (créée à 12:31:32)
SELECT 
    'ALBA - Simulations potentielles (créées entre 12:00 et 12:31)' as contexte,
    s.id,
    s.session_token,
    s.client_id,
    c.email as client_email,
    c.type as client_type,
    s.type as sim_type,
    s.status,
    s.created_at,
    EXTRACT(EPOCH FROM (TIMESTAMP '2025-11-05 12:31:32+00' - s.created_at)) / 60 as minutes_avant_inscription,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' THEN (
            SELECT COUNT(*) FROM jsonb_object_keys(s.answers)
        )
        ELSE 0
    END as nb_reponses
FROM simulations s
LEFT JOIN "Client" c ON c.id = s.client_id
WHERE s.created_at BETWEEN 
    TIMESTAMP '2025-11-05 12:00:00+00' AND 
    TIMESTAMP '2025-11-05 12:31:32+00'
ORDER BY s.created_at DESC;

