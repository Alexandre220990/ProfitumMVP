-- =====================================================
-- CRÉATION DE LA TABLE ADMINAUDITLOG
-- Traçabilité complète des actions admin
-- =====================================================

-- ===== 1. CRÉATION DE LA TABLE ADMINAUDITLOG =====

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence à l'admin qui a effectué l'action
    admin_id UUID NOT NULL REFERENCES "Admin"(id) ON DELETE CASCADE,
    
    -- Détails de l'action
    action VARCHAR(100) NOT NULL CHECK (action IN (
        -- Actions sur les experts
        'expert_created', 'expert_updated', 'expert_deleted', 'expert_approved', 'expert_rejected',
        'expert_demo_request_created', 'expert_status_changed', 'expert_compensation_updated',
        
        -- Actions sur les clients
        'client_created', 'client_updated', 'client_deleted', 'client_status_changed',
        'client_assignment_created', 'client_document_uploaded',
        
        -- Actions sur les dossiers
        'dossier_created', 'dossier_updated', 'dossier_deleted', 'dossier_status_changed',
        'dossier_step_completed', 'dossier_expert_assigned', 'dossier_expert_removed',
        
        -- Actions sur les assignations
        'assignment_created', 'assignment_updated', 'assignment_deleted', 'assignment_status_changed',
        'assignment_expert_changed', 'assignment_compensation_updated',
        
        -- Actions sur les notifications
        'notification_created', 'notification_updated', 'notification_deleted',
        'notification_sent', 'notification_bulk_sent',
        
        -- Actions sur les produits
        'product_created', 'product_updated', 'product_deleted', 'product_status_changed',
        'product_eligibility_updated',
        
        -- Actions sur les audits
        'audit_created', 'audit_updated', 'audit_deleted', 'audit_status_changed',
        'audit_expert_assigned', 'audit_completed',
        
        -- Actions sur les calendriers
        'calendar_event_created', 'calendar_event_updated', 'calendar_event_deleted',
        'calendar_event_participant_added', 'calendar_event_participant_removed',
        
        -- Actions sur les messages
        'message_created', 'message_updated', 'message_deleted', 'conversation_created',
        'conversation_updated', 'conversation_deleted',
        
        -- Actions système
        'system_config_updated', 'backup_created', 'maintenance_mode_toggled',
        'user_permissions_updated', 'role_assigned', 'role_removed',
        
        -- Actions de sécurité
        'login_successful', 'login_failed', 'password_changed', 'account_locked',
        'session_terminated', 'ip_blocked', 'suspicious_activity_detected'
    )),
    
    -- Ressource affectée
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    
    -- Détails des changements
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    
    -- Métadonnées de l'action
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Informations de contexte
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Informations de performance
    execution_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour performance
    CONSTRAINT admin_audit_log_admin_action_idx UNIQUE (admin_id, action, created_at)
);

-- ===== 2. INDEX POUR PERFORMANCE =====

-- Index sur admin_id pour les requêtes par admin
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON "AdminAuditLog"(admin_id);

-- Index sur action pour les requêtes par type d'action
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON "AdminAuditLog"(action);

-- Index sur table_name pour les requêtes par table
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_name ON "AdminAuditLog"(table_name);

-- Index sur record_id pour les requêtes par enregistrement
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_record_id ON "AdminAuditLog"(record_id);

-- Index sur created_at pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON "AdminAuditLog"(created_at DESC);

-- Index sur severity pour les requêtes par niveau de gravité
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_severity ON "AdminAuditLog"(severity);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_date ON "AdminAuditLog"(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_date ON "AdminAuditLog"(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_date ON "AdminAuditLog"(table_name, created_at DESC);

-- ===== 3. FONCTIONS UTILITAIRES =====

-- Fonction pour logger automatiquement les actions admin
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_table_name VARCHAR(50),
    p_record_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT '{}'::jsonb,
    p_new_values JSONB DEFAULT '{}'::jsonb,
    p_description TEXT DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_start_time TIMESTAMP;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Insérer l'action dans le log
    INSERT INTO "AdminAuditLog" (
        admin_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        description,
        severity,
        ip_address,
        user_agent,
        session_id,
        execution_time_ms
    ) VALUES (
        p_admin_id,
        p_action,
        p_table_name,
        p_record_id,
        p_old_values,
        p_new_values,
        p_description,
        p_severity,
        p_ip_address,
        p_user_agent,
        p_session_id,
        EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer l'historique des actions d'un admin
CREATE OR REPLACE FUNCTION get_admin_audit_history(
    p_admin_id UUID,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    action VARCHAR(100),
    table_name VARCHAR(50),
    record_id UUID,
    description TEXT,
    severity VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aal.id,
        aal.action,
        aal.table_name,
        aal.record_id,
        aal.description,
        aal.severity,
        aal.created_at
    FROM "AdminAuditLog" aal
    WHERE aal.admin_id = p_admin_id
    ORDER BY aal.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les actions par type
CREATE OR REPLACE FUNCTION get_actions_by_type(
    p_action VARCHAR(100),
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    admin_id UUID,
    table_name VARCHAR(50),
    record_id UUID,
    description TEXT,
    severity VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aal.id,
        aal.admin_id,
        aal.table_name,
        aal.record_id,
        aal.description,
        aal.severity,
        aal.created_at
    FROM "AdminAuditLog" aal
    WHERE aal.action = p_action
    ORDER BY aal.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 4. TRIGGERS AUTOMATIQUES =====

-- Trigger pour logger automatiquement les changements sur la table Expert
CREATE OR REPLACE FUNCTION trigger_log_expert_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
    v_action VARCHAR(100);
    v_description TEXT;
BEGIN
    -- Déterminer l'action
    IF TG_OP = 'INSERT' THEN
        v_action := 'expert_created';
        v_description := 'Nouvel expert créé: ' || NEW.name;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'expert_updated';
        v_description := 'Expert modifié: ' || NEW.name;
        
        -- Détecter les changements spécifiques
        IF OLD.approval_status != NEW.approval_status THEN
            IF NEW.approval_status = 'approved' THEN
                v_action := 'expert_approved';
                v_description := 'Expert approuvé: ' || NEW.name;
            ELSIF NEW.approval_status = 'rejected' THEN
                v_action := 'expert_rejected';
                v_description := 'Expert rejeté: ' || NEW.name;
            END IF;
        END IF;
        
        IF OLD.status != NEW.status THEN
            v_action := 'expert_status_changed';
            v_description := 'Statut expert changé: ' || NEW.name || ' (' || OLD.status || ' → ' || NEW.status || ')';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'expert_deleted';
        v_description := 'Expert supprimé: ' || OLD.name;
    END IF;
    
    -- Récupérer l'admin_id depuis la session (à adapter selon votre système)
    -- Pour l'instant, on utilise une valeur par défaut
    v_admin_id := COALESCE(current_setting('app.current_admin_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Logger l'action
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

-- Créer le trigger sur la table Expert
DROP TRIGGER IF EXISTS log_expert_changes_trigger ON "Expert";
CREATE TRIGGER log_expert_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Expert"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_expert_changes();

-- ===== 5. VUES UTILITAIRES =====

-- Vue pour les actions récentes des admins
CREATE OR REPLACE VIEW admin_recent_actions AS
SELECT 
    aal.id,
    aal.admin_id,
    adm.name as admin_name,
    adm.email as admin_email,
    aal.action,
    aal.table_name,
    aal.record_id,
    aal.description,
    aal.severity,
    aal.created_at,
    aal.ip_address
FROM "AdminAuditLog" aal
JOIN "Admin" adm ON aal.admin_id = adm.id
ORDER BY aal.created_at DESC;

-- Vue pour les statistiques d'actions par admin
CREATE OR REPLACE VIEW admin_action_stats AS
SELECT 
    aal.admin_id,
    adm.name as admin_name,
    adm.email as admin_email,
    aal.action,
    COUNT(*) as action_count,
    MIN(aal.created_at) as first_action,
    MAX(aal.created_at) as last_action
FROM "AdminAuditLog" aal
JOIN "Admin" adm ON aal.admin_id = adm.id
GROUP BY aal.admin_id, adm.name, adm.email, aal.action
ORDER BY action_count DESC;

-- Vue pour les actions critiques
CREATE OR REPLACE VIEW admin_critical_actions AS
SELECT 
    aal.id,
    aal.admin_id,
    adm.name as admin_name,
    aal.action,
    aal.table_name,
    aal.record_id,
    aal.description,
    aal.severity,
    aal.created_at,
    aal.ip_address
FROM "AdminAuditLog" aal
JOIN "Admin" adm ON aal.admin_id = adm.id
WHERE aal.severity IN ('error', 'critical')
ORDER BY aal.created_at DESC;

-- ===== 6. POLITIQUES RLS =====

-- Activer RLS sur la table AdminAuditLog
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;

-- Politique : Les admins peuvent voir leurs propres actions
CREATE POLICY "Admins can view their own audit logs" ON "AdminAuditLog"
    FOR SELECT
    USING (admin_id = auth.uid()::UUID);

-- Politique : Les admins peuvent voir toutes les actions (pour les super admins)
CREATE POLICY "Super admins can view all audit logs" ON "AdminAuditLog"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = auth.uid()::UUID 
            AND role = 'super_admin'
        )
    );

-- Politique : Seul le système peut insérer des logs
CREATE POLICY "System can insert audit logs" ON "AdminAuditLog"
    FOR INSERT
    WITH CHECK (true);

-- ===== 7. DONNÉES DE TEST =====

-- Insérer quelques actions de test (optionnel)
INSERT INTO "AdminAuditLog" (
    admin_id,
    action,
    table_name,
    record_id,
    description,
    severity,
    ip_address,
    user_agent
) VALUES 
(
    (SELECT id FROM "Admin" LIMIT 1),
    'expert_created',
    'Expert',
    gen_random_uuid(),
    'Test: Expert créé via formulaire de contact',
    'info',
    '127.0.0.1'::INET,
    'Test User Agent'
),
(
    (SELECT id FROM "Admin" LIMIT 1),
    'expert_approved',
    'Expert',
    gen_random_uuid(),
    'Test: Expert approuvé après validation',
    'info',
    '127.0.0.1'::INET,
    'Test User Agent'
);

-- ===== 8. VÉRIFICATION FINALE =====

-- Vérifier que la table a été créée correctement
SELECT 
    '✅ Table AdminAuditLog créée' as status,
    COUNT(*) as total_records
FROM "AdminAuditLog";

-- Vérifier les index
SELECT 
    '✅ Index créés' as status,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'AdminAuditLog';

-- Vérifier les fonctions
SELECT 
    '✅ Fonctions créées' as status,
    COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('log_admin_action', 'get_admin_audit_history', 'get_actions_by_type');

-- Vérifier les triggers
SELECT 
    '✅ Triggers créés' as status,
    COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname = 'log_expert_changes_trigger';

-- Vérifier les vues
SELECT 
    '✅ Vues créées' as status,
    COUNT(*) as view_count
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('admin_recent_actions', 'admin_action_stats', 'admin_critical_actions'); 