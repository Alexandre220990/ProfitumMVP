-- ============================================================================
-- CRÉATION DES VUES DE NOTIFICATIONS (À EXÉCUTER APRÈS LE SCRIPT PRINCIPAL)
-- Date : 2025-01-05
-- Objectif : Créer les vues qui dépendent des fonctions
-- ============================================================================

-- ===== 1. VUE POUR LES STATISTIQUES DE NOTIFICATIONS =====
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    n.notification_type,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN nm.status = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN nm.status = 'read' THEN 1 END) as read,
    COUNT(CASE WHEN nm.status = 'failed' THEN 1 END) as failed,
    AVG(EXTRACT(EPOCH FROM (nm.delivered_at - nm.sent_at))) as avg_delivery_time_seconds
FROM notification n
LEFT JOIN notification_metrics nm ON n.id = nm.notification_id
GROUP BY n.notification_type;

-- ===== 2. VUE POUR LES PRÉFÉRENCES UTILISATEUR AVEC STATISTIQUES =====
CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
    np.user_id,
    np.user_type,
    np.email_enabled,
    np.push_enabled,
    np.in_app_enabled,
    COUNT(n.id) as total_notifications,
    COUNT(CASE WHEN n.is_read = true THEN 1 END) as read_notifications,
    COUNT(CASE WHEN n.is_read = false THEN 1 END) as unread_notifications
FROM notification_preferences np
LEFT JOIN notification n ON np.user_id = n.user_id
GROUP BY np.user_id, np.user_type, np.email_enabled, np.push_enabled, np.in_app_enabled;

-- ===== 3. VUE POUR LES NOTIFICATIONS AVEC PRÉFÉRENCES =====
CREATE OR REPLACE VIEW notification_with_preferences AS
SELECT 
    n.*,
    np.email_enabled,
    np.push_enabled,
    np.in_app_enabled,
    np.quiet_hours_enabled,
    np.quiet_hours_start,
    np.quiet_hours_end,
    -- Logique simplifiée pour déterminer si la notification doit être envoyée
    CASE 
        WHEN np.user_id IS NULL THEN true -- Pas de préférences = accepter par défaut
        WHEN np.quiet_hours_enabled = false THEN true -- Heures silencieuses désactivées
        WHEN n.priority = 'urgent' THEN true -- Notifications urgentes toujours envoyées
        WHEN CURRENT_TIME BETWEEN np.quiet_hours_start AND np.quiet_hours_end THEN false -- En heures silencieuses
        ELSE true -- Hors heures silencieuses
    END as should_send
FROM notification n
LEFT JOIN notification_preferences np ON n.user_id = np.user_id;

-- ===== 4. VUE POUR LES TEMPLATES ACTIFS =====
CREATE OR REPLACE VIEW active_notification_templates AS
SELECT 
    id,
    name,
    title_template,
    message_template,
    notification_type,
    priority,
    channels,
    variables
FROM notification_templates 
WHERE is_active = true
ORDER BY notification_type, priority;

-- ===== 5. VUE POUR LES GROUPES AVEC MEMBRES =====
CREATE OR REPLACE VIEW notification_groups_with_members AS
SELECT 
    ng.id as group_id,
    ng.name as group_name,
    ng.description,
    ng.user_type,
    ng.is_active,
    COUNT(ngm.user_id) as member_count,
    ARRAY_AGG(ngm.user_id) as member_ids
FROM notification_groups ng
LEFT JOIN notification_group_members ngm ON ng.id = ngm.group_id
GROUP BY ng.id, ng.name, ng.description, ng.user_type, ng.is_active;

-- ===== 6. VUE POUR LES MÉTRIQUES DÉTAILLÉES =====
CREATE OR REPLACE VIEW detailed_notification_metrics AS
SELECT 
    nm.*,
    n.title,
    n.message,
    n.notification_type,
    n.priority,
    n.user_id,
    n.user_type,
    EXTRACT(EPOCH FROM (nm.delivered_at - nm.sent_at)) as delivery_time_seconds,
    EXTRACT(EPOCH FROM (nm.read_at - nm.delivered_at)) as read_time_seconds
FROM notification_metrics nm
JOIN notification n ON nm.notification_id = n.id;

-- ===== 7. MESSAGE DE CONFIRMATION =====
DO $$
BEGIN
    RAISE NOTICE '✅ Vues de notifications créées avec succès !';
    RAISE NOTICE '📊 Vues créées : notification_stats, user_notification_summary, notification_with_preferences';
    RAISE NOTICE '🎯 Vues créées : active_notification_templates, notification_groups_with_members, detailed_notification_metrics';
END $$;
