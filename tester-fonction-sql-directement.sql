-- =====================================================
-- TEST DIRECT FONCTION SQL evaluer_eligibilite_avec_calcul
-- =====================================================

-- Trouver une simulation récente pour tester
SELECT 
    id,
    session_token,
    client_id,
    answers,
    status
FROM simulations
WHERE session_token = '360f998d-6e85-4742-8104-e5fdeb25923c';

-- Tester directement la fonction SQL avec cette simulation
SELECT evaluer_eligibilite_avec_calcul('4c868ff4-8d2b-4a80-acb4-18d193a770bf'::uuid);

-- OU utiliser l'ID de la dernière simulation
DO $$
DECLARE
    v_sim_id UUID;
    v_result JSONB;
BEGIN
    -- Récupérer l'ID de la dernière simulation
    SELECT id INTO v_sim_id
    FROM simulations
    ORDER BY created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'Test de la simulation: %', v_sim_id;
    
    -- Appeler la fonction
    v_result := evaluer_eligibilite_avec_calcul(v_sim_id);
    
    RAISE NOTICE 'Résultat: %', v_result;
    RAISE NOTICE 'Success: %', v_result->>'success';
    RAISE NOTICE 'Total eligible: %', v_result->>'total_eligible';
    RAISE NOTICE 'Produits: %', v_result->'produits';
END $$;

