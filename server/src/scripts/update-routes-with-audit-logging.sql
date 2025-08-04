-- =====================================================
-- MISE À JOUR DES ROUTES AVEC LOGGING AUTOMATIQUE
-- Intégration du système d'audit dans les routes existantes
-- =====================================================

-- ===== 1. FONCTION UTILITAIRE POUR LOGGING AUTOMATIQUE =====

-- Fonction pour logger automatiquement les actions admin depuis les routes
CREATE OR REPLACE FUNCTION log_admin_action_from_route(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_table_name VARCHAR(50),
    p_record_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT '{}'::jsonb,
    p_new_values JSONB DEFAULT '{}'::jsonb,
    p_description TEXT DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_ip_address INET;
    v_user_agent TEXT;
    v_session_id TEXT;
BEGIN
    -- Extraire les informations de la requête
    v_ip_address := COALESCE((p_request_info->>'ip_address')::INET, '127.0.0.1'::INET);
    v_user_agent := p_request_info->>'user_agent';
    v_session_id := p_request_info->>'session_id';
    
    -- Logger l'action
    SELECT log_admin_action(
        p_admin_id,
        p_action,
        p_table_name,
        p_record_id,
        p_old_values,
        p_new_values,
        p_description,
        p_severity,
        v_ip_address,
        v_user_agent,
        v_session_id
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 2. FONCTION POUR LOGGING DES ACTIONS EXPERT =====

-- Fonction spécialisée pour les actions sur les experts
CREATE OR REPLACE FUNCTION log_expert_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_expert_id UUID,
    p_old_values JSONB DEFAULT '{}'::jsonb,
    p_new_values JSONB DEFAULT '{}'::jsonb,
    p_description TEXT DEFAULT NULL,
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_severity VARCHAR(20);
BEGIN
    -- Déterminer la sévérité selon l'action
    CASE p_action
        WHEN 'expert_approved', 'expert_rejected' THEN
            v_severity := 'warning';
        WHEN 'expert_deleted' THEN
            v_severity := 'error';
        ELSE
            v_severity := 'info';
    END CASE;
    
    -- Logger l'action
    SELECT log_admin_action_from_route(
        p_admin_id,
        p_action,
        'Expert',
        p_expert_id,
        p_old_values,
        p_new_values,
        p_description,
        v_severity,
        p_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 3. FONCTION POUR LOGGING DES ACTIONS CLIENT =====

-- Fonction spécialisée pour les actions sur les clients
CREATE OR REPLACE FUNCTION log_client_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_client_id UUID,
    p_old_values JSONB DEFAULT '{}'::jsonb,
    p_new_values JSONB DEFAULT '{}'::jsonb,
    p_description TEXT DEFAULT NULL,
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_severity VARCHAR(20);
BEGIN
    -- Déterminer la sévérité selon l'action
    CASE p_action
        WHEN 'client_deleted' THEN
            v_severity := 'error';
        WHEN 'client_status_changed' THEN
            v_severity := 'warning';
        ELSE
            v_severity := 'info';
    END CASE;
    
    -- Logger l'action
    SELECT log_admin_action_from_route(
        p_admin_id,
        p_action,
        'Client',
        p_client_id,
        p_old_values,
        p_new_values,
        p_description,
        v_severity,
        p_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 4. FONCTION POUR LOGGING DES ACTIONS D'ASSIGNATION =====

-- Fonction spécialisée pour les actions sur les assignations
CREATE OR REPLACE FUNCTION log_assignment_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_assignment_id UUID,
    p_old_values JSONB DEFAULT '{}'::jsonb,
    p_new_values JSONB DEFAULT '{}'::jsonb,
    p_description TEXT DEFAULT NULL,
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_severity VARCHAR(20);
BEGIN
    -- Déterminer la sévérité selon l'action
    CASE p_action
        WHEN 'assignment_deleted' THEN
            v_severity := 'error';
        WHEN 'assignment_expert_changed' THEN
            v_severity := 'warning';
        ELSE
            v_severity := 'info';
    END CASE;
    
    -- Logger l'action
    SELECT log_admin_action_from_route(
        p_admin_id,
        p_action,
        'expertassignment',
        p_assignment_id,
        p_old_values,
        p_new_values,
        p_description,
        v_severity,
        p_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5. FONCTION POUR LOGGING DES ACTIONS DE NOTIFICATION =====

-- Fonction spécialisée pour les actions sur les notifications
CREATE OR REPLACE FUNCTION log_notification_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_notification_id UUID,
    p_old_values JSONB DEFAULT '{}'::jsonb,
    p_new_values JSONB DEFAULT '{}'::jsonb,
    p_description TEXT DEFAULT NULL,
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_severity VARCHAR(20);
BEGIN
    -- Déterminer la sévérité selon l'action
    CASE p_action
        WHEN 'notification_bulk_sent' THEN
            v_severity := 'warning';
        ELSE
            v_severity := 'info';
    END CASE;
    
    -- Logger l'action
    SELECT log_admin_action_from_route(
        p_admin_id,
        p_action,
        'notification',
        p_notification_id,
        p_old_values,
        p_new_values,
        p_description,
        v_severity,
        p_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 6. FONCTION POUR LOGGING DES ACTIONS SYSTÈME =====

-- Fonction spécialisée pour les actions système
CREATE OR REPLACE FUNCTION log_system_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    -- Logger l'action système
    SELECT log_admin_action_from_route(
        p_admin_id,
        p_action,
        'System',
        NULL,
        '{}'::jsonb,
        '{}'::jsonb,
        p_description,
        p_severity,
        p_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 7. FONCTION POUR LOGGING DES ACTIONS DE SÉCURITÉ =====

-- Fonction spécialisée pour les actions de sécurité
CREATE OR REPLACE FUNCTION log_security_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_request_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    -- Logger l'action de sécurité
    SELECT log_admin_action_from_route(
        p_admin_id,
        p_action,
        'Security',
        NULL,
        '{}'::jsonb,
        '{}'::jsonb,
        p_description,
        p_severity,
        p_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 8. FONCTION POUR RÉCUPÉRER LES INFORMATIONS DE REQUÊTE =====

-- Fonction pour extraire les informations de requête
CREATE OR REPLACE FUNCTION get_request_info(
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'ip_address', COALESCE(p_ip_address, '127.0.0.1'::INET),
        'user_agent', COALESCE(p_user_agent, 'Unknown'),
        'session_id', COALESCE(p_session_id, 'unknown'),
        'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 9. FONCTION POUR LOGGING AUTOMATIQUE DES CONNEXIONS =====

-- Fonction pour logger les connexions admin
CREATE OR REPLACE FUNCTION log_admin_login(
    p_admin_id UUID,
    p_success BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_action VARCHAR(100);
    v_description TEXT;
    v_severity VARCHAR(20);
    v_request_info JSONB;
BEGIN
    -- Déterminer l'action et la sévérité
    IF p_success THEN
        v_action := 'login_successful';
        v_description := 'Connexion admin réussie';
        v_severity := 'info';
    ELSE
        v_action := 'login_failed';
        v_description := 'Tentative de connexion admin échouée';
        v_severity := 'warning';
    END IF;
    
    -- Préparer les informations de requête
    v_request_info := get_request_info(p_ip_address, p_user_agent);
    
    -- Logger l'action
    SELECT log_security_action(
        p_admin_id,
        v_action,
        v_description,
        v_severity,
        v_request_info
    ) INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 10. VÉRIFICATION DES FONCTIONS CRÉÉES =====

-- Vérifier que toutes les fonctions ont été créées
SELECT 
    '🔧 FONCTIONS LOGGING' as section,
    'Fonctions créées' as test,
    proname as function_name,
    CASE 
        WHEN proname IN ('log_admin_action_from_route', 'log_expert_action', 'log_client_action', 'log_assignment_action', 'log_notification_action', 'log_system_action', 'log_security_action', 'get_request_info', 'log_admin_login') 
        THEN '✅ Fonction créée'
        ELSE '⚠️ Fonction manquante'
    END as status
FROM pg_proc 
WHERE proname IN ('log_admin_action_from_route', 'log_expert_action', 'log_client_action', 'log_assignment_action', 'log_notification_action', 'log_system_action', 'log_security_action', 'get_request_info', 'log_admin_login')
ORDER BY proname;

-- ===== 11. EXEMPLE D'UTILISATION =====

-- Exemple d'utilisation dans une route (commenté pour référence)
/*
-- Dans une route POST /api/admin/experts
-- Après avoir créé un expert avec succès :

SELECT log_expert_action(
    admin_id, -- ID de l'admin connecté
    'expert_created',
    new_expert_id,
    '{}'::jsonb, -- old_values (vide pour création)
    to_jsonb(new_expert), -- new_values
    'Expert créé via formulaire admin',
    get_request_info(req.ip, req.get('User-Agent'), session_id)
);

-- Dans une route PUT /api/admin/experts/:id
-- Après avoir mis à jour un expert :

SELECT log_expert_action(
    admin_id,
    'expert_updated',
    expert_id,
    to_jsonb(old_expert), -- old_values
    to_jsonb(new_expert), -- new_values
    'Expert modifié via formulaire admin',
    get_request_info(req.ip, req.get('User-Agent'), session_id)
);

-- Dans une route DELETE /api/admin/experts/:id
-- Après avoir supprimé un expert :

SELECT log_expert_action(
    admin_id,
    'expert_deleted',
    expert_id,
    to_jsonb(deleted_expert), -- old_values
    '{}'::jsonb, -- new_values (vide pour suppression)
    'Expert supprimé via interface admin',
    get_request_info(req.ip, req.get('User-Agent'), session_id)
);
*/

-- ===== 12. RAPPORT FINAL =====

SELECT 
    '🎯 INTÉGRATION LOGGING' as section,
    'Fonctions de logging' as test,
    COUNT(*) as function_count,
    CASE 
        WHEN COUNT(*) >= 9 THEN '✅ Toutes les fonctions créées'
        WHEN COUNT(*) >= 7 THEN '✅ La plupart des fonctions créées'
        WHEN COUNT(*) >= 5 THEN '⚠️ Fonctions principales créées'
        ELSE '❌ Fonctions manquantes'
    END as status
FROM pg_proc 
WHERE proname IN ('log_admin_action_from_route', 'log_expert_action', 'log_client_action', 'log_assignment_action', 'log_notification_action', 'log_system_action', 'log_security_action', 'get_request_info', 'log_admin_login'); 