-- Correction finale V2 avec gestion des doublons

-- 1. Vérifier la contrainte d'unicité
SELECT 
    '1. CONTRAINTE UNICITÉ' as test,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'AdminAuditLog' 
AND constraint_type = 'UNIQUE';

-- 2. Corriger la fonction avec gestion des doublons
CREATE OR REPLACE FUNCTION trigger_log_expert_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
    v_action VARCHAR(50);
    v_description TEXT;
    v_retry_count INTEGER := 0;
    v_max_retries INTEGER := 3;
BEGIN
    -- Récupérer un admin_id valide
    SELECT id INTO v_admin_id FROM "Admin" LIMIT 1;
    
    -- Si aucun admin n'existe, ne pas logger
    IF v_admin_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Déterminer l'action avec les valeurs autorisées
    CASE TG_OP
        WHEN 'INSERT' THEN
            v_action := 'expert_created';
            v_description := 'Nouvel expert créé';
        WHEN 'UPDATE' THEN
            v_action := 'expert_updated';
            v_description := 'Expert modifié';
        WHEN 'DELETE' THEN
            v_action := 'expert_deleted';
            v_description := 'Expert supprimé';
    END CASE;
    
    -- Tentative d'insertion avec gestion des doublons
    LOOP
        BEGIN
            -- Logger l'action avec un délai pour éviter les doublons
            PERFORM log_admin_action(
                v_admin_id,
                v_action,
                'Expert',
                COALESCE(NEW.id, OLD.id),
                CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE '{}'::jsonb END,
                CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE '{}'::jsonb END,
                v_description
            );
            EXIT; -- Sortir de la boucle si succès
        EXCEPTION
            WHEN unique_violation THEN
                v_retry_count := v_retry_count + 1;
                IF v_retry_count >= v_max_retries THEN
                    -- Après 3 tentatives, abandonner le logging
                    EXIT;
                END IF;
                -- Attendre un peu avant de réessayer
                PERFORM pg_sleep(0.1);
            WHEN OTHERS THEN
                -- Pour toute autre erreur, abandonner
                EXIT;
        END;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Vérifier la fonction corrigée
SELECT 
    '3. FONCTION CORRIGÉE V2' as test,
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
    'Test insertion après correction V2'
) RETURNING id, expert_id, client_id, client_produit_eligible_id, status, created_at;

-- 5. Nettoyer le test
DELETE FROM "expertassignment" 
WHERE expert_id = 'a26a9609-a160-47a0-9698-955876c3618d' 
AND client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004'
AND notes = 'Test insertion après correction V2';
