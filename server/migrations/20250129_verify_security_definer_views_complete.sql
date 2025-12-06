-- ============================================================================
-- VÉRIFICATION COMPLÈTE : Liste toutes les vues avec SECURITY DEFINER
-- ============================================================================
-- Ce script permet de vérifier l'état des vues avant et après la migration
-- ============================================================================
-- Date : 2025-01-29
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : Vérification via reloptions (méthode la plus fiable)
-- ============================================================================
SELECT 
  'Méthode 1: Via reloptions' as methode,
  n.nspname as schema_name,
  c.relname as view_name,
  c.reloptions as options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.reloptions IS NOT NULL
  AND 'security_definer=true' = ANY(c.reloptions)
ORDER BY c.relname;

-- ============================================================================
-- PARTIE 2 : Vérification via la définition (pour les vues créées différemment)
-- ============================================================================
SELECT 
  'Méthode 2: Via définition' as methode,
  schemaname as schema_name,
  viewname as view_name,
  LEFT(definition, 200) as definition_preview
FROM pg_views
WHERE schemaname = 'public'
  AND (definition LIKE '%SECURITY DEFINER%' 
       OR definition LIKE '%security definer%'
       OR definition LIKE '%SECURITY_DEFINER%')
ORDER BY viewname;

-- ============================================================================
-- PARTIE 3 : Vérification de l'existence des vues listées dans le rapport
-- ============================================================================
SELECT 
  'Vérification existence' as methode,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' AND viewname = vue_nom
    ) THEN '✅ Existe'
    ELSE '❌ N''existe pas'
  END as statut,
  vue_nom as view_name
FROM (
  VALUES
    ('vue_apporteur_sources_prospects'),
    ('vue_apporteur_experts'),
    ('vue_apporteur_produits'),
    ('vue_apporteur_notifications'),
    ('vue_apporteur_conversations'),
    ('vue_apporteur_commissions'),
    ('vue_apporteur_kpis_globaux'),
    ('vue_apporteur_agenda'),
    ('vue_apporteur_rendez_vous'),
    ('vue_apporteur_dashboard_principal'),
    ('vue_apporteur_prospects_detaille'),
    ('vue_apporteur_performance_produits'),
    ('vue_apporteur_statistiques_mensuelles'),
    ('vue_apporteur_commissions_calculees'),
    ('vue_apporteur_objectifs_performance'),
    ('vue_apporteur_activite_recente'),
    ('vue_analytics_admin_metrics'),
    ('vue_analytics_expert_analyse_temporelle'),
    ('vue_analytics_admin_produits'),
    ('vue_analytics_geographique'),
    ('vue_analytics_admin_experts'),
    ('vue_analytics_expert_metrics'),
    ('vue_analytics_expert_performance_mensuelle'),
    ('vue_analytics_expert_top_produits'),
    ('vue_analytics_expert_distribution_clients'),
    ('vue_sessions_actives_globale'),
    ('vue_metriques_systeme_globale'),
    ('vue_sessions_actives'),
    ('vue_metriques_systeme_recentes'),
    ('v_admin_client_process_documents'),
    ('v_admin_documentation_app'),
    ('admin_recent_actions'),
    ('admin_action_stats'),
    ('admin_critical_actions'),
    ('vue_admin_kpis_globaux'),
    ('vue_admin_alertes_globales'),
    ('vue_admin_activite_globale'),
    ('v_calendar_events_with_participants'),
    ('v_today_events'),
    ('prospects_pending_enrichment'),
    ('prospects_pending_ai'),
    ('prospects_ready_for_emailing'),
    ('prospect_emails_to_send_today'),
    ('prospect_replies_summary'),
    ('prospects_stats'),
    ('expert_stats_view'),
    ('v_expert_assignments'),
    ('notification_stats'),
    ('user_notification_summary'),
    ('notification_groups_with_members'),
    ('notification_with_preferences'),
    ('AdminNotificationActive'),
    ('v_assignment_reports'),
    ('v_dossier_steps_with_assignee'),
    ('vue_stats_produits_v2'),
    ('vue_stats_produits_globale'),
    ('DossierCommentStats'),
    ('DossierHistoriqueEnrichi'),
    ('EmailMetrics'),
    ('v_email_duplicates_analysis'),
    ('vue_alertes_dashboard_v2'),
    ('vue_dashboard_kpis_v2'),
    ('vue_activite_recente_v2'),
    ('vue_evolution_30j_v2'),
    ('vue_prospects_detaille'),
    ('vue_utilisation_sessions'),
    ('authenticated_users')
) AS vues_list(vue_nom)
ORDER BY vue_nom;

-- ============================================================================
-- PARTIE 4 : Résumé - Compte total des vues avec SECURITY DEFINER
-- ============================================================================
SELECT 
  COUNT(DISTINCT view_name) as total_vues_avec_security_definer,
  COALESCE(string_agg(DISTINCT view_name, ', ' ORDER BY view_name), 'Aucune') as liste_vues
FROM (
  SELECT c.relname as view_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.reloptions IS NOT NULL
    AND 'security_definer=true' = ANY(c.reloptions)
  
  UNION
  
  SELECT v.viewname as view_name
  FROM pg_views v
  WHERE v.schemaname = 'public'
    AND (v.definition LIKE '%SECURITY DEFINER%' 
         OR v.definition LIKE '%security definer%'
         OR v.definition LIKE '%SECURITY_DEFINER%')
) combined_views;

-- ============================================================================
-- PARTIE 5 : Statistiques générales
-- ============================================================================
SELECT 
  'Statistiques' as type_info,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public') as total_vues_public,
  (SELECT COUNT(*) 
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'v'
     AND c.reloptions IS NOT NULL
     AND 'security_definer=true' = ANY(c.reloptions)
  ) as vues_avec_security_definer_reloptions,
  (SELECT COUNT(*) 
   FROM pg_views 
   WHERE schemaname = 'public'
     AND (definition LIKE '%SECURITY DEFINER%' 
          OR definition LIKE '%security definer%'
          OR definition LIKE '%SECURITY_DEFINER%')
  ) as vues_avec_security_definer_definition;
