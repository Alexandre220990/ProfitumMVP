-- ============================================================================
-- TEST INSERTION CONVERSATION MANUELLE
-- ============================================================================
-- Date : 24 octobre 2025
-- Objectif : Reproduire exactement ce que le backend fait
-- ============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🧪 TEST 1 : Insertion avec IDs valides (comme backend)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- ID de l'apporteur (conseilprofitum@gmail.com)
-- database_id: 10705490-5e3b-49a2-a0db-8e3d5a5af38e

-- Récupérer un client existant
DO $$
DECLARE
    v_client_id uuid;
    v_apporteur_id uuid := '10705490-5e3b-49a2-a0db-8e3d5a5af38e';
    v_conversation_id uuid;
BEGIN
    -- Récupérer le premier client
    SELECT id INTO v_client_id 
    FROM "Client" 
    WHERE company_name = 'Alino SAS'
    LIMIT 1;
    
    RAISE NOTICE 'Client ID: %', v_client_id;
    RAISE NOTICE 'Apporteur ID: %', v_apporteur_id;
    
    -- Tenter l'insertion EXACTEMENT comme le backend
    INSERT INTO conversations (
        type,
        participant_ids,
        title,
        status,
        created_by
    ) VALUES (
        'expert_client',
        ARRAY[v_apporteur_id, v_client_id],
        'Test Manual Conversation',
        'active',
        v_apporteur_id
    )
    RETURNING id INTO v_conversation_id;
    
    RAISE NOTICE '✅ Conversation créée: %', v_conversation_id;
    
    -- Vérifier qu'elle existe
    IF v_conversation_id IS NOT NULL THEN
        RAISE NOTICE '✅ RETURNING a fonctionné !';
        
        -- Afficher la conversation
        PERFORM * FROM conversations WHERE id = v_conversation_id;
    ELSE
        RAISE NOTICE '❌ RETURNING a retourné NULL !';
    END IF;
    
    -- Annuler pour ne pas polluer
    RAISE EXCEPTION 'Test terminé (rollback automatique)';
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🧪 TEST 2 : Insertion avec participant_ids contenant chaîne vide'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

DO $$
DECLARE
    v_client_id uuid;
    v_conversation_id uuid;
BEGIN
    SELECT id INTO v_client_id 
    FROM "Client" 
    WHERE company_name = 'Alino SAS'
    LIMIT 1;
    
    RAISE NOTICE 'Test avec participant_ids contenant chaîne vide...';
    
    -- Tenter insertion avec ['', 'uuid-valide']
    BEGIN
        INSERT INTO conversations (
            type,
            participant_ids,
            title,
            status,
            created_by
        ) VALUES (
            'expert_client',
            ARRAY[''::uuid, v_client_id],  -- ⚠️ Premier élément vide
            'Test Empty UUID',
            'active',
            v_client_id
        )
        RETURNING id INTO v_conversation_id;
        
        RAISE NOTICE '⚠️ Insertion réussie avec UUID vide: %', v_conversation_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erreur attendue: %', SQLERRM;
    END;
    
    RAISE EXCEPTION 'Test terminé (rollback automatique)';
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🧪 TEST 3 : Vérifier que Alino SAS existe'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
    id,
    company_name,
    first_name,
    last_name,
    email,
    is_active
FROM "Client"
WHERE company_name ILIKE '%Alino%'
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ TESTS TERMINÉS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

