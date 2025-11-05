-- =====================================================
-- VÉRIFICATION ET CALCUL DES PRODUITS ÉLIGIBLES
-- Date : 2025-11-05
-- Alba: be2cf2fb-c102-494d-b7ba-fb4196d49f02 (2 simulations, 0 produits)
-- Alain: 4c367715-56e3-4992-b9aa-80e4fd48ca6c (2 simulations, 0 produits)
-- =====================================================

-- ===== 1. DÉTAILS DES SIMULATIONS EXISTANTES =====
SELECT 
    '📊 SIMULATIONS EXISTANTES' as section,
    c.email,
    c.name,
    s.id as simulation_id,
    s.type,
    s.status,
    s.created_at,
    s.session_token,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
        THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'array'
        THEN jsonb_array_length(s.answers)
        ELSE 0
    END as nb_reponses,
    CASE 
        WHEN s.results IS NOT NULL AND jsonb_typeof(s.results) = 'object'
        THEN TRUE
        ELSE FALSE
    END as has_results,
    s.metadata->>'migrated_from' as migration_info
FROM simulations s
JOIN "Client" c ON c.id = s.client_id
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, s.created_at DESC;

-- ===== 2. CONTENU DES RÉPONSES (ANSWERS) =====
SELECT 
    '📋 CONTENU ANSWERS' as section,
    c.email,
    s.id as simulation_id,
    s.answers
FROM simulations s
JOIN "Client" c ON c.id = s.client_id
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
AND s.answers IS NOT NULL
ORDER BY c.email, s.created_at DESC;

-- ===== 3. IDENTIFIER LA MEILLEURE SIMULATION =====
-- Celle avec le plus de réponses et status completed
WITH best_simulations AS (
    SELECT 
        c.email,
        c.id as client_id,
        s.id as simulation_id,
        s.status,
        s.answers,
        CASE 
            WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
            THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
            ELSE 0
        END as nb_reponses,
        ROW_NUMBER() OVER (
            PARTITION BY c.id 
            ORDER BY 
                CASE WHEN s.status = 'completed' THEN 0 ELSE 1 END,
                CASE 
                    WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
                    THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
                    ELSE 0
                END DESC,
                s.created_at DESC
        ) as rn
    FROM simulations s
    JOIN "Client" c ON c.id = s.client_id
    WHERE c.id IN (
        'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
        '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
    )
)
SELECT 
    '🎯 MEILLEURE SIMULATION PAR CLIENT' as section,
    email,
    simulation_id,
    status,
    nb_reponses
FROM best_simulations
WHERE rn = 1;

-- ===== 4. VÉRIFIER SI LA SIMULATION TEMPORAIRE DOIT ÊTRE LIÉE À ALAIN =====
-- Simulation: d7f1d6cd-622e-4554-a16f-f7116e6872aa
SELECT 
    '🔗 SIMULATION TEMPORAIRE À LIER?' as section,
    s.id,
    s.session_token,
    s.status,
    s.created_at,
    CASE 
        WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
        THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
        ELSE 0
    END as nb_reponses,
    'Créée 19 sec avant inscription Alain' as note
FROM simulations s
WHERE s.id = 'd7f1d6cd-622e-4554-a16f-f7116e6872aa';

-- Vérifier si cette simulation n'est pas déjà liée à Alain
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM simulations 
            WHERE id = 'd7f1d6cd-622e-4554-a16f-f7116e6872aa'
            AND client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
        )
        THEN '✅ Déjà liée à Alain'
        ELSE '❌ NON liée à Alain - À migrer'
    END as statut_liaison;

-- ===== 5. MIGRATION DE LA SIMULATION TEMPORAIRE VERS ALAIN (SI NÉCESSAIRE) =====
-- Uniquement si elle n'est pas déjà liée
UPDATE simulations
SET 
    client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c',
    type = 'authentifiee',
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'migrated_at', NOW(),
        'migrated_from', 'temporary_client_d7f1d6cd',
        'migration_reason', 'client_registration_alain',
        'original_client_id', client_id
    )
WHERE id = 'd7f1d6cd-622e-4554-a16f-f7116e6872aa'
AND client_id != '4c367715-56e3-4992-b9aa-80e4fd48ca6c';

-- ===== 6. CALCUL DES PRODUITS ÉLIGIBLES =====
-- Pour chaque client, prendre la meilleure simulation et appeler la fonction SQL

-- ALBA
WITH alba_best_sim AS (
    SELECT 
        s.id,
        s.answers,
        CASE 
            WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
            THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
            ELSE 0
        END as nb_reponses
    FROM simulations s
    WHERE s.client_id = 'be2cf2fb-c102-494d-b7ba-fb4196d49f02'
    ORDER BY 
        CASE WHEN s.status = 'completed' THEN 0 ELSE 1 END,
        CASE 
            WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
            THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
            ELSE 0
        END DESC
    LIMIT 1
),
alba_question_ids AS (
    SELECT 
        ARRAY(
            SELECT jsonb_array_elements_text(
                (SELECT jsonb_agg(key) FROM jsonb_object_keys(answers) key)
            )
        ) as question_ids
    FROM alba_best_sim
)
SELECT 
    '🧮 CALCUL ÉLIGIBILITÉ ALBA' as action,
    evaluer_eligibilite_avec_calcul(
        question_ids,
        'be2cf2fb-c102-494d-b7ba-fb4196d49f02'
    ) as resultat
FROM alba_question_ids;

-- ALAIN
WITH alain_best_sim AS (
    SELECT 
        s.id,
        s.answers,
        CASE 
            WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
            THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
            ELSE 0
        END as nb_reponses
    FROM simulations s
    WHERE s.client_id = '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
    ORDER BY 
        CASE WHEN s.status = 'completed' THEN 0 ELSE 1 END,
        CASE 
            WHEN s.answers IS NOT NULL AND jsonb_typeof(s.answers) = 'object' 
            THEN (SELECT COUNT(*) FROM jsonb_object_keys(s.answers))
            ELSE 0
        END DESC
    LIMIT 1
),
alain_question_ids AS (
    SELECT 
        ARRAY(
            SELECT jsonb_array_elements_text(
                (SELECT jsonb_agg(key) FROM jsonb_object_keys(answers) key)
            )
        ) as question_ids
    FROM alain_best_sim
)
SELECT 
    '🧮 CALCUL ÉLIGIBILITÉ ALAIN' as action,
    evaluer_eligibilite_avec_calcul(
        question_ids,
        '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
    ) as resultat
FROM alain_question_ids;

-- ===== 7. VÉRIFICATION FINALE =====
SELECT 
    '✅ RÉSULTAT FINAL' as section,
    c.email,
    c.name,
    (SELECT COUNT(*) FROM simulations WHERE client_id = c.id) as nb_simulations,
    (SELECT COUNT(*) FROM "ClientProduitEligible" WHERE "clientId" = c.id) as nb_produits,
    (SELECT SUM("montantFinal") FROM "ClientProduitEligible" WHERE "clientId" = c.id) as montant_total
FROM "Client" c
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email;

-- Détails des produits créés
SELECT 
    '📦 PRODUITS CRÉÉS' as section,
    c.email,
    p.nom as produit,
    cpe.statut,
    cpe."montantFinal",
    cpe."simulationId",
    cpe."dateEligibilite"
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE c.id IN (
    'be2cf2fb-c102-494d-b7ba-fb4196d49f02',
    '4c367715-56e3-4992-b9aa-80e4fd48ca6c'
)
ORDER BY c.email, cpe."dateEligibilite" DESC;

