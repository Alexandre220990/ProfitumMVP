-- ============================================================================
-- CORRECTION DES SIMULATIONS BLOQUÉES
-- ============================================================================

-- 1. Lister les simulations bloquées avec détails
SELECT 
  id,
  client_id,
  session_token,
  status,
  created_at,
  jsonb_pretty(answers) as reponses
FROM simulations
WHERE status IN ('en_cours', 'in_progress')
ORDER BY created_at DESC;

-- 2. Mettre à jour le statut des simulations sans réponses
UPDATE simulations
SET 
  status = 'abandoned',
  updated_at = NOW()
WHERE status IN ('en_cours', 'in_progress')
  AND (answers IS NULL OR answers = '{}'::jsonb OR jsonb_typeof(answers) = 'null');

-- 3. Calculer l'éligibilité pour TOUTES les simulations avec réponses
-- Cette requête va calculer automatiquement pour toutes les simulations bloquées avec réponses
DO $$
DECLARE
  v_sim RECORD;
  v_result JSONB;
BEGIN
  FOR v_sim IN 
    SELECT id 
    FROM simulations 
    WHERE status IN ('en_cours', 'in_progress')
      AND answers IS NOT NULL 
      AND answers != '{}'::jsonb
      AND jsonb_typeof(answers) != 'null'
  LOOP
    BEGIN
      -- Calculer l'éligibilité
      v_result := evaluer_eligibilite_avec_calcul(v_sim.id);
      
      RAISE NOTICE 'Simulation % traitée: % produits éligibles', 
        v_sim.id, 
        v_result->>'total_eligible';
      
      -- Mettre à jour le statut
      UPDATE simulations
      SET 
        status = 'completed',
        results = v_result,
        updated_at = NOW()
      WHERE id = v_sim.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erreur pour simulation %: %', v_sim.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- 4. Vérification finale
SELECT 
  status,
  COUNT(*) as nombre_simulations
FROM simulations
GROUP BY status
ORDER BY status;

-- 5. Afficher les simulations corrigées
SELECT 
  id,
  status,
  results->>'total_eligible' as produits_eligibles,
  updated_at
FROM simulations
WHERE status = 'completed'
  AND updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

