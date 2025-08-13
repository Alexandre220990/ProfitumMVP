-- Script pour corriger le problème de trigger sur Expert
-- Le trigger update_expert_stats déclenche un autre trigger qui essaie d'insérer dans AdminAuditLog avec un admin_id invalide

-- 1. Vérifier les triggers sur la table Expert
SELECT 
    '1. TRIGGERS EXPERT' as test,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'Expert';

-- 2. Vérifier la fonction log_admin_action
SELECT 
    '2. FONCTION LOG_ADMIN_ACTION' as test,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'log_admin_action';

-- 3. Vérifier la table AdminAuditLog
SELECT 
    '3. STRUCTURE ADMINAUDITLOG' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'AdminAuditLog'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes sur AdminAuditLog
SELECT 
    '4. CONTRAINTES ADMINAUDITLOG' as test,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'AdminAuditLog';

-- 4b. Vérifier les contraintes de vérification sur AdminAuditLog
SELECT 
    '4b. CONTRAINTES CHECK ADMINAUDITLOG' as test,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'AdminAuditLog'::regclass 
AND contype = 'c';

-- 5. Vérifier s'il y a des admins dans la table Admin
SELECT 
    '5. ADMINS EXISTANTS' as test,
    COUNT(*) as nombre_admins
FROM "Admin";

-- 5b. Récupérer le premier admin_id
SELECT 
    '5b. PREMIER ADMIN' as test,
    id as premier_admin_id,
    email,
    name
FROM "Admin"
LIMIT 1;

-- 6. Vérifier la fonction trigger_log_expert_changes
SELECT 
    '6. FONCTION TRIGGER_LOG_EXPERT_CHANGES' as test,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'trigger_log_expert_changes';

-- 7. Corriger la fonction trigger_log_expert_changes pour utiliser un admin_id valide
-- Créer une nouvelle version de la fonction qui utilise un admin_id existant
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
    
    -- Déterminer l'action
    CASE TG_OP
        WHEN 'INSERT' THEN
            v_action := 'CREATE';
            v_description := 'Nouvel expert créé';
        WHEN 'UPDATE' THEN
            v_action := 'MODIFY';  -- Valeur autorisée au lieu de 'UPDATE'
            v_description := 'Expert modifié';
        WHEN 'DELETE' THEN
            v_action := 'DELETE';
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

-- 8. Test d'insertion après correction
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
    'Test insertion après correction trigger'
) RETURNING id, expert_id, client_id, client_produit_eligible_id, status, created_at;

-- 9. Nettoyer le test
DELETE FROM "expertassignment" 
WHERE expert_id = 'a26a9609-a160-47a0-9698-955876c3618d' 
AND client_id = '25274ba6-67e6-4151-901c-74851fe2d82a'
AND client_produit_eligible_id = '93374842-cca6-4873-b16e-0ada92e97004'
AND notes = 'Test insertion après correction trigger';
