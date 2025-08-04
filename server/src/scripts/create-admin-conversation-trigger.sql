-- Trigger pour créer automatiquement les conversations admin
-- Génère les conversations admin pour les nouveaux clients et experts

-- 1. Fonction pour créer la conversation admin d'un client
CREATE OR REPLACE FUNCTION create_client_admin_conversation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO conversations (
        id, type, participant_ids, title, description, status,
        client_id, created_by, access_level, priority, category,
        created_at, updated_at
    )
    VALUES (
        gen_random_uuid(),
        'admin_support',
        ARRAY[NEW.id, (SELECT id FROM "Admin" ORDER BY created_at LIMIT 1)],
        'Support Administratif - ' || COALESCE(NEW.name, NEW.email),
        'Conversation automatique pour le support administratif du client',
        'active',
        NEW.id,
        (SELECT id FROM "Admin" ORDER BY created_at LIMIT 1),
        'private',
        'medium',
        'support',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction pour créer la conversation admin d'un expert
CREATE OR REPLACE FUNCTION create_expert_admin_conversation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO conversations (
        id, type, participant_ids, title, description, status,
        expert_id, created_by, access_level, priority, category,
        created_at, updated_at
    )
    VALUES (
        gen_random_uuid(),
        'admin_support',
        ARRAY[NEW.id, (SELECT id FROM "Admin" ORDER BY created_at LIMIT 1)],
        'Support Administratif - ' || COALESCE(NEW.name, NEW.email),
        'Conversation automatique pour le support administratif de l''expert',
        'active',
        NEW.id,
        (SELECT id FROM "Admin" ORDER BY created_at LIMIT 1),
        'private',
        'medium',
        'support',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer les triggers
DROP TRIGGER IF EXISTS trigger_create_client_admin_conversation ON "Client";
CREATE TRIGGER trigger_create_client_admin_conversation
    AFTER INSERT ON "Client"
    FOR EACH ROW
    EXECUTE FUNCTION create_client_admin_conversation();

DROP TRIGGER IF EXISTS trigger_create_expert_admin_conversation ON "Expert";
CREATE TRIGGER trigger_create_expert_admin_conversation
    AFTER INSERT ON "Expert"
    FOR EACH ROW
    EXECUTE FUNCTION create_expert_admin_conversation();

-- 4. Vérifier que les triggers sont créés
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
    'trigger_create_client_admin_conversation',
    'trigger_create_expert_admin_conversation'
); 