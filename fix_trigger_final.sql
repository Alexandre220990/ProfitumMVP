-- Correction finale de la fonction trigger_log_expert_changes

-- 1. Vérifier la fonction actuelle
SELECT 
    '1. FONCTION ACTUELLE' as test,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'trigger_log_expert_changes';

-- 2. Corriger la fonction avec les bonnes valeurs d'action autorisées
CREATE OR REPLACE FUNCTION trigger_log_expert_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
    v_action VARCHAR(50);
    v_description TEXT;
BEGIN
    -- Récupérer un admin_id valide (le premier disponible)
    SELECT id INTO v_admin_id FROM "Admin" LIMIT 1;
    
    -- Si aucun admin n'existe, ne pas logger (éviter l'erreur)
    IF v_admin_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Déterminer l'action (utiliser les valeurs autorisées par la contrainte)
    CASE TG_OP
        WHEN 'INSERT' THEN
            v_action := 'expert_created';  -- Valeur autorisée
            v_description := 'Nouvel expert créé';
        WHEN 'UPDATE' THEN
            v_action := 'expert_updated';  -- Valeur autorisée
            v_description := 'Expert modifié';
        WHEN 'DELETE' THEN
            v_action := 'expert_deleted';  -- Valeur autorisée
            v_description := 'Expert supprimé';
    END CASE;
    
    -- Logger l'action avec un admin_id valide
    PERFORM log_admin_action(
        v_admin_id,
        v_action,
        'Expert',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE '{}'::jsonb END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE '{}'::jsonb END,
        v_description
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Vérifier la fonction corrigée
SELECT 
    '3. FONCTION CORRIGÉE' as test,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'trigger_log_expert_changes';

-- 4. Test d'insertion
INSERT INTO "expertassignment" (
    expert_id,
    client_id,
    client_produit_eligible_id,
    status,
    assignment_date,
    notes
) VALUES (
    'a26a9609-a160-47a0-9698-955876c3618d',
    '25274ba6-67e6-4151-901c-74851fe2d82a',
    '93374842-cca6-4873-b16e-0ada92e97004',
    'pending',
    NOW(),
    'Test insertion après correction finale'
) RETURNING id, expert_id, client_id, client_produit_eligible_id, status, created_at;

-- 5. Nettoyer le test
DELETE FROM "expertassignment" 
WHERE expert_id = 'a26a9609-a160-47a0-9698-955876c3618d' 
AND client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004'
AND notes = 'Test insertion après correction finale';
